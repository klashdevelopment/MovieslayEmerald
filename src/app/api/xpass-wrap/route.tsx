// app/api/xpass/route.ts

const BASE = "https://play.xpass.top";

const XPASS_HEADERS = {
  "accept": "*/*",
  "accept-language": "en-US,en;q=0.9",
  "cache-control": "no-cache",
  "pragma": "no-cache",
  "priority": "u=1, i",
  "sec-ch-ua": '"Chromium";v="148", "Brave";v="148", "Not/A)Brand";v="99"',
  "sec-ch-ua-mobile": "?0",
  "sec-ch-ua-platform": '"Windows"',
  "sec-fetch-dest": "empty",
  "sec-fetch-mode": "cors",
  "sec-fetch-site": "same-origin",
  "sec-gpc": "1",
  "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.7378.102 Safari/537.36",
  "Origin": "https://play.xpass.top",
  "Referrer": "https://play.xpass.top/",
};

interface XpassSource {
  id: string;
  name: string;
  url: string;
  dl: boolean;
}

interface StreamSource {
  file: string;
  type: string;
  label: string;
  id: string;
}

interface PlaylistResponse {
  playlist: Array<{ sources: StreamSource[] }>;
}

async function fetchSources(
  type: string,
  id: string,
  season: string | null,
  episode: string | null,
  headers: Record<string, string>
): Promise<XpassSource[]> {
  const url =
    type === "tv"
      ? `${BASE}/data/tv/${id}/${season}/${episode}?autostart=true&force=true`
      : `${BASE}/data/movie/${id}?autostart=true`;

//   const res = await fetch(url, { headers,
//     referrer: `${BASE}/e/${type}/${id}${season && episode ? `/${season}/${episode}` : ""}?autostart=true`,
//    });

    const AEProxyUrl = `https://api.anyembed.xyz/api/proxy?url=${encodeURIComponent(url)}&origin=${encodeURIComponent(XPASS_HEADERS.Origin)}&referer=${encodeURIComponent(XPASS_HEADERS.Referrer)}&headers=${encodeURIComponent(JSON.stringify(headers))}`;
    const res = await fetch(AEProxyUrl);
  if (!res.ok) throw new Error(`Sources fetch failed: ${res.status}`);
  return res.json();
}

async function resolveStream(
  sourceId: string,
  sources: XpassSource[],
  headers: Record<string, string>
) {
  const source = sources.find((s) => s.id === sourceId);
  if (!source) throw new Error(`Source ID not found: ${sourceId}`);
  if (!source.url) throw new Error(`Source ${sourceId} has no URL`);

  const mdataRes = await fetch(`${BASE}${source.url}`, { headers });
  if (!mdataRes.ok) throw new Error(`mdata fetch failed: ${mdataRes.status}`);
  const mdata: PlaylistResponse = await mdataRes.json();

  return mdata.playlist[0].sources.map((s) => ({
    file: s.file.includes('.txt') ? `https://api.anyembed.xyz/api/proxy?url=${encodeURIComponent(s.file)}&origin=${encodeURIComponent(XPASS_HEADERS.Origin)}&referer=${encodeURIComponent(XPASS_HEADERS.Referrer)}` : s.file,
    type: s.type,
    label: s.label,
    id: s.id,
  }));
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);

  const type = searchParams.get("type");
  const id = searchParams.get("id");
  const season = searchParams.get("season");
  const episode = searchParams.get("episode");
  const sourceId = searchParams.get("source");

  if (!type || !id) {
    return Response.json({ error: "Missing required params: type, id" }, { status: 400 });
  }
  if (type === "tv" && (!season || !episode)) {
    return Response.json({ error: "TV requires season and episode params" }, { status: 400 });
  }

  const headers = {
    ...XPASS_HEADERS,
    referer: `${BASE}/e/${type}/${id}?autostart=true`,
    cookie: `auth_token=b9d3ed43504d2b9e3e972b5d5df6db5a18a86fab6a060db96f454ba3d38d151f`
  };

  try {
    const sources = await fetchSources(type, id, season, episode, headers);

    if (!sourceId) {
      return Response.json({ sources });
    }

    const stream = await resolveStream(sourceId, sources, headers);
    return Response.json(stream);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return Response.json({ error: message }, { status: 500 });
  }
}