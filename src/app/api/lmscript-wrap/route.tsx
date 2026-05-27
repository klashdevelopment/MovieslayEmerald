import { NextRequest } from "next/server";

export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const name = searchParams.get("name");
    const tmdbId = searchParams.get("tmdbId");
    const s = searchParams.get("s");
    const e = searchParams.get("e");
    if (!name) {
        return new Response("Missing 'name' query parameter", { status: 400 });
    }

    if (s && e) {
        // const url = `https://lmscript.xyz/v1/shows?filters[q]=${encodeURIComponent(name)}&expand=episodes`;
        // const response = await fetch(url);
        // const data = await response.json();

        // const show = data.items.find((item: any) => (item.tmdb_prefix === tmdbId || item.tmdb_id === tmdbId));
        // if (!show) {
        //     return new Response("show not found", { status: 404 });
        // }
        // const episode = show.episodes.find((ep: any) => ep.season === parseInt(s) && ep.episode === parseInt(e));
        // if (!episode) {
        //     return new Response("episode not found", { status: 404 });
        // }
        return new Response("lmscript shows not supported, bogus unauthorization", { status: 401 });
    } else {
        const url = `https://lmscript.xyz/v1/movies?filters[q]=${encodeURIComponent(name)}&expand=streams,subtitles`;
        const response = await fetch(url);
        const data = await response.json();

        const movie = data.items.find((item: any) => (`${item.tmdb_prefix}` === `${tmdbId}` || `${item.tmdb_id}` === `${tmdbId}`));
        if (!movie) {
            return new Response("movie not found", { status: 404 });
        }
        const streams = movie.streams; // {"360p": "url", ...}

        const SOURCE_ORDER = ["1080p", "720p", "480p", "360p"];
        const sortedStreams = Object.keys(streams).sort((a, b) => SOURCE_ORDER.indexOf(a) - SOURCE_ORDER.indexOf(b));

        const result = {
            title: movie.title,
            tmdbId: movie.tmdb_id,
            source: {
                url: streams[sortedStreams[0]],
                quality: sortedStreams[0],
            },
            subtitles: movie.subtitles.map((sub: any) => ({
                url: `https://lmscript.xyz${sub.url}`,
                language: sub.language,
                type: sub.format,
                label: `${sub.source_id.slice(-6)}`
            })),
        };
        return new Response(JSON.stringify(result), { status: 200 });
    }
}