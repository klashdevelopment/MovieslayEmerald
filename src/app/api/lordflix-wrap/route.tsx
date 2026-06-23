import { NextRequest, NextResponse } from "next/server";

const HEADERS = {
  Accept: "*/*",
  Origin: "https://lordflix.org",
  Referer: "https://lordflix.org/",
  "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0.0.0 Safari/537.36",
};

const ENC_DEC_API = "https://enc-dec.app/api";
const SNOWHOUSE = "https://snowhouse.lordflix.club";

interface EncDecResponse<T = string> {
  status: number;
  result?: T;
  error?: string;
}

interface EncLordflixResult {
  url: string;
  sign: string;
}

interface Server {
  name: string;
  status: string;
  language: string;
}

interface RawCaption {
  type: string;
  id: string;
  url: string;
  language: string;
}

interface RawStream {
  id: string;
  type: string;
  playlist: string;
  captions?: RawCaption[];
}

interface OutputSource {
  url: string;
  type: string;
  label: string;
}

interface OutputCaption {
  type: string;
  url: string;
  language: string;
  label: string;
}

function validate<T>(data: EncDecResponse<T>, path: string): T {
  if (data.status !== 200 || data.result === undefined) {
    throw new Error(
      `API error at ${path} — status ${data.status}: ${data.error ?? "unknown"}`
    );
  }
  return data.result;
}

async function getImdbId(type: string, id: string, name: string, year: string): Promise<string> {
  const res = await fetch(
    `https://api.anyembed.xyz/api/meta?tmdb_id=${id}&title=${encodeURIComponent(name)}&year=${year}&type=${type}`
  );
  if (!res.ok) throw new Error(`Meta lookup failed: HTTP ${res.status}`);
  const json = await res.json();
  if (!json.imdb_id) throw new Error("No imdb_id in meta response");
  return json.imdb_id;
}

async function getServers(): Promise<string[]> {
  const res = await fetch(`${SNOWHOUSE}/servers`);
  if (!res.ok) throw new Error(`Servers endpoint returned HTTP ${res.status}`);
  const json: { servers: Server[] } = await res.json();
  return json.servers.filter((s) => s.status === "ok").map((s) => s.name);
}

async function resolveHlsVariants(playlistUrl: string): Promise<OutputSource[]> {
  const baseUrl = playlistUrl.substring(0, playlistUrl.lastIndexOf("/") + 1);

  const text = await fetch(playlistUrl, { headers: HEADERS }).then((r) => r.text());
  const lines = text.split("\n");

  const sources: OutputSource[] = [];

  for (let i = 0; i < lines.length; i++) {
    if (lines[i].startsWith("#EXT-X-STREAM-INF") && i + 1 < lines.length) {
      const inf = lines[i];
      const filename = lines[i + 1].trim();

      if (!filename || filename.startsWith("#")) continue;

      const resolutionMatch = inf.match(/RESOLUTION=(\d+x\d+)/);
      const bandwidthMatch = inf.match(/BANDWIDTH=(\d+)/);

      let label: string;
      if (resolutionMatch) {
        const height = resolutionMatch[1].split("x")[1];
        label = `${height}p`;
      } else if (bandwidthMatch) {
        label = `${Math.round(parseInt(bandwidthMatch[1]) / 1000)}k`;
      } else {
        label = `track-${sources.length + 1}`;
      }

      const url = filename.startsWith("http") ? filename : baseUrl + filename;
      sources.push({ url, type: "hls", label });
    }
  }

  if (sources.length === 0 && text.includes("#EXTM3U")) {
    sources.push({ url: playlistUrl, type: "hls", label: "auto" });
  }

  return sources;
}

export async function GET(req: NextRequest) {
  const p = req.nextUrl.searchParams;

  const tmdbId = p.get("tmdbId");
  const title = p.get("title");
  const year = p.get("year");
  const season = p.get("s");
  const episode = p.get("e");
  const server = p.get("server");
  const raw = p.get("raw") === "true";

  if (!tmdbId || !title || !year) {
    return NextResponse.json(
      { error: "Missing required parameters: tmdbId, title, year" },
      { status: 400 }
    );
  }

  const isTV = season !== null && episode !== null;

  if ((season === null) !== (episode === null)) {
    return NextResponse.json(
      { error: "Both 's' (season) and 'e' (episode) must be provided together" },
      { status: 400 }
    );
  }

  const mediaType = isTV ? "tv" : "movie";
  const lordflixType = isTV ? "series" : "movie";

  if (!server) {
    try {
      const servers = await getServers();
      return NextResponse.json({ servers });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unexpected error";
      return NextResponse.json({ error: message }, { status: 502 });
    }
  }

  try {
    const imdbId = await getImdbId(mediaType, tmdbId, title, year);

    const snowhouseUrl = isTV
      ? `${SNOWHOUSE}/?title=${encodeURIComponent(title)}&type=${lordflixType}&year=${year}&imdb=${imdbId}&tmdb=${tmdbId}&server=${encodeURIComponent(server)}&season=${season}&episode=${episode}`
      : `${SNOWHOUSE}/?title=${encodeURIComponent(title)}&type=${lordflixType}&year=${year}&imdb=${imdbId}&tmdb=${tmdbId}&server=${encodeURIComponent(server)}`;

    const encUrl = `${ENC_DEC_API}/enc-lordflix?url=${encodeURIComponent(snowhouseUrl)}`;
    const encRes = await fetch(encUrl);
    if (!encRes.ok) throw new Error(`enc-lordflix returned HTTP ${encRes.status}`);

    const encData: EncDecResponse<EncLordflixResult> = await encRes.json();
    const { url: encMediaUrl, sign } = validate(encData, encUrl);

    const encryptedText = await fetch(encMediaUrl, { headers: HEADERS }).then((r) => r.text());

    const decUrl = `${ENC_DEC_API}/dec-lordflix`;
    const decRes = await fetch(decUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: encryptedText, sign }),
    });
    if (!decRes.ok) throw new Error(`dec-lordflix returned HTTP ${decRes.status}`);

    const decData: EncDecResponse = await decRes.json();
    const decrypted = validate(decData, decUrl);

    if(raw) {
      return NextResponse.json({ raw_response: decrypted });
    }

    const parsed: { stream: RawStream[] } =
      typeof decrypted === "string" ? JSON.parse(decrypted) : decrypted;

    let sources: OutputSource[] = [];
    const captions: OutputCaption[] = [];

    for (const stream of parsed.stream) {
      if (stream.type === "hls") {
        const variants = await resolveHlsVariants(stream.playlist);
        sources.push(...variants);
      } else {
        sources.push({ url: stream.playlist, type: stream.type, label: stream.id });
      }

      for (const cap of stream.captions ?? []) {
        captions.push({
          type: cap.type,
          url: cap.url,
          language: cap.language,
          label: cap.id,
        });
      }
    }

    const sourcesProxied = sources.map((s) => ({
      // https://api.anyembed.xyz/api/proxy?url=https%3A%2F%2Fok.horseapples.cc%2Fm3u8%3F%3DP2UMf4lqDCAnbpY496BRBL1hL6JdCqSwNrqIq_sp6vaRK4xGV23GRseymP6WesUqP_bMmoWTmcU0ryxmZNvD_J-6JzaEWdUtq1vPDbhR5fZJzXDU4AoVkpPHy8VfX3HhLI68m3Ek2zVB_5w_qn14BQ&headers={%22Origin%22:%22https://lordflix.org%22,%22Referer%22:%22https://lordflix.org/%22,%22User-Agent%22:%22Mozilla/5.0%20(Macintosh;%20Intel%20Mac%20OS%20X%2010_15_7)%20AppleWebKit/537.36%20(KHTML,%20like%20Gecko)%20Chrome/149.0.0.0%20Safari/537.36%22}
      url: `https://api.anyembed.xyz/api/proxy?url=${encodeURIComponent(s.url.replaceAll('//', '/').replace(':/', '://'))}&headers=${encodeURIComponent(
        JSON.stringify(HEADERS)
      )}`,
      type: s.type,
      label: s.label,
    }));

    return NextResponse.json({ sources: sourcesProxied, captions });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unexpected error";
    console.log(err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}