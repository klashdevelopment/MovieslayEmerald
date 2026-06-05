import { NextRequest } from "next/server";

const apis = [
    'https://torrentio.strem.fun',
    'https://streamio.heykanhaiya.xyz'
]

interface MagnetOptions {
  infoHash: string;
  name?: string;
  sources?: string[];
  fileIdx?: number;
}

function buildMagnetURI({ infoHash, name, sources = [] }: MagnetOptions): string {
  const params = new URLSearchParams();

  params.set("xt", `urn:btih:${infoHash}`);

  if (name) params.set("dn", name);

  for (const source of sources) {
    if (source.startsWith("tracker:")) {
      params.append("tr", source.slice("tracker:".length));
    }
  }

  return `magnet:?${params.toString()}`;
}

export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const tmdbId = searchParams.get("tmdbId");
    if (!tmdbId) {
        return new Response("Missing tmdbId parameter", { status: 400 });
    }
    const season = searchParams.get("season");
    const episode = searchParams.get("episode");

    let type = "movie";
    if(season || episode) {
        type = "series";
        if(!season || !episode) {
            return new Response("Missing season or episode parameter for TV show", { status: 400 });
        }
    }

    const tmdbRes = await fetch(`https://api.themoviedb.org/3/movie/${tmdbId}/external_ids?api_key=${process.env.TMDB_API_KEY}`);
    const tmdbData = await tmdbRes.json();
    let imdbId = tmdbData.imdb_id;
    if (!imdbId) {
        const anyEmbedRes = await fetch(`https://api.anyembed.xyz/api/meta?tmdb_id=${tmdbId}`);
        const anyEmbedData = await anyEmbedRes.json();
        imdbId = anyEmbedData.imdb_id;
        if (!imdbId) {
            return new Response("No IMDb ID found for the given TMDB ID", { status: 404 });
        }
    }

    const apiResults = await Promise.all(
        apis.map(async (api) => {
            try {
                const res = await fetch(`${api}/stream/${type}/${imdbId}${season ? `:${season}:${episode}` : ""}.json`);
                if (!res.ok) return null;

                const data = await res.json();
                if (!data || !data.streams || data.streams.length === 0) return null;

                return data.streams;
            } catch (error) {
                console.error(`Error fetching from ${api}:`, error);
                return null;
            }
        })
    );

    const streams = apiResults.find((result) => result && result.length > 0);
    if (streams) {
        const responses = streams.map((stream: any) => ({
            label: stream.name + ' - ' + stream.behaviorHints?.filename,
            magnet: buildMagnetURI({ infoHash: stream.infoHash||stream.behaviorHints?.infoHash, name: stream.behaviorHints?.filename, sources: stream.sources}),
            // UUID is generated on the client side.
        }))
        return new Response(JSON.stringify(responses), {
            headers: { "Content-Type": "application/json" },
        });
    }

    return new Response("No streams found for the given TMDB ID", { status: 404 });
}