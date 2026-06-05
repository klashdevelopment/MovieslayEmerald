// written as a nextjs route.ts
// get /api/dl-peachify-wrap?id=950387 (movie)
// get /api/dl-peachify-wrap?id=220102&s=1&e=1 (tv)

const BASE_URL = "https://dl.peachify.top";

let cachedHashes: { hashes: string[]; fetchedAt: number } | null = null;

async function getActionHashes(endpoint: string): Promise<string[]> {
  if (cachedHashes && Date.now() - cachedHashes.fetchedAt < 1000 * 60 * 60) {
    return cachedHashes.hashes;
  }

  const pageRes = await fetch(endpoint, {
    headers: { "accept": "text/html", "user-agent": "Mozilla/5.0" },
  });
  const html = await pageRes.text();

  const chunkUrls = [...html.matchAll(/"(\/_next\/static\/chunks\/[a-f0-9]+\.js)"/g)].map(m => m[1]);

  for (const url of chunkUrls) {
    const res = await fetch(`${BASE_URL}${url}`);
    const text = await res.text();
    const matches = [...text.matchAll(/[0-9a-f]{40,}/g)].map(m => m[0]);
    if (matches.length === 4) {
      cachedHashes = { hashes: matches, fetchedAt: Date.now() };
      return matches;
    }
  }

  throw new Error("Could not find action hashes");
}

async function rscFetch(endpoint: string, actionHash: string, body: unknown, routerState: string) {
  const res = await fetch(endpoint, {
    method: "POST",
    headers: {
      "accept": "text/x-component",
      "accept-language": "en-US,en;q=0.8",
      "content-type": "text/plain;charset=UTF-8",
      "next-action": actionHash,
      "next-router-state-tree": routerState,
      "origin": BASE_URL,
      "referer": endpoint,
    },
    body: JSON.stringify(body),
  });

  const text = await res.text();

  for (const line of text.split("\n")) {
    const match = line.match(/^1:(.+)$/);
    if (match) {
      try { return JSON.parse(match[1]); }
      catch { return null; }
    }
  }
  return null;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  const s = searchParams.get("s");
  const e = searchParams.get("e");

  if (!id) return Response.json({ error: "Missing id" }, { status: 400 });

  const isTV = s && e;
  const mediaType = isTV ? "tv" : "movie";
  const endpoint = isTV
    ? `${BASE_URL}/tv/${id}/${s}/${e}`
    : `${BASE_URL}/movie/${id}`;

    // You *could* just do this via a regular array and then encodeURIComponent but im kinda lazy
  const routerState = isTV
    ? `%5B%22%22%2C%7B%22children%22%3A%5B%22tv%22%2C%7B%22children%22%3A%5B%5B%22id%22%2C%22${id}%22%2C%22d%22%5D%2C%7B%22children%22%3A%5B%5B%22ss%22%2C%22${s}%22%2C%22d%22%5D%2C%7B%22children%22%3A%5B%5B%22ep%22%2C%22${e}%22%2C%22d%22%5D%2C%7B%22children%22%3A%5B%22__PAGE__%22%2C%7B%7D%2Cnull%2Cnull%5D%7D%2Cnull%2Cnull%5D%7D%2Cnull%2Cnull%5D%7D%2Cnull%2Cnull%5D%7D%2Cnull%2Cnull%5D%7D%2Cnull%2Cnull%2Ctrue%5D`
    : `%5B%22%22%2C%7B%22children%22%3A%5B%22movie%22%2C%7B%22children%22%3A%5B%5B%22id%22%2C%22${id}%22%2C%22d%22%5D%2C%7B%22children%22%3A%5B%22__PAGE__%22%2C%7B%7D%2Cnull%2Cnull%5D%7D%2Cnull%2Cnull%5D%7D%2Cnull%2Cnull%5D%7D%2Cnull%2Cnull%2Ctrue%5D`;

  try {
    const hashes = await getActionHashes(endpoint);
    // console.log("[route] hashes:", hashes);
    const providerHash = hashes[1];
    const sourcesHash = hashes[2];
    // console.log("[route] providerHash:", providerHash, "sourcesHash:", sourcesHash);

    const providers: { key: string; label: string }[] = await rscFetch(endpoint, providerHash, [mediaType], routerState);
    // console.log("[route] providers:", providers);

    if (!providers?.length) {
      // console.log("[route] no provider");
      return Response.json({ sources: [] });
    }

    const results = await Promise.allSettled(
      providers.map((provider) =>
        rscFetch(endpoint, sourcesHash, [{ mediaType, tmdbId: id, providerKey: provider.key }], routerState)
      )
    );

    // results.forEach((result, i) => {
    //   if (result.status === "rejected") {
    //     console.log(`[route] provider ${providers[i].key} rejected 4`, result.reason);
    //   } else {
    //     console.log(`[route] provider ${providers[i].key} resulted `, JSON.stringify(result.value)?.substring(0, 300));
    //   }
    // });

    const sources = results.flatMap((result, i) => {
      if (result.status === "rejected" || !result.value?.success) return [];
      return (result.value.sources ?? []).map((src: { url: string; quality: string }) => ({
        label: `${providers[i].label} ${src.quality}`,
        url: src.url,
      }));
    });

    // console.log("[route] final sources:", sources.length);
    return Response.json({ sources });
  } catch (err) {
    // console.log("[route] error:", err);
    return Response.json({ error: String(err) }, { status: 500 });
  }
}