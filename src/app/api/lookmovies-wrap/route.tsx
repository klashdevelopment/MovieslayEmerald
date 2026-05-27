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

    // https://lmscript.xyz/v1/movies?filters[q]=Project%20Hail%20Mary
    // https://lmscript.xyz/v1/shows?filters[q]=The%20Last%20of%20Us
    // For these, just check the data.items for the one with an equal tmdb_id or tmdb_prefix.
    // Once found, store the id_movie or id_show.
    // For shows, https://www.lookmovie2.to/api/v2/download/episode/list?id=5252 with the id_show,
    // then find data.list[s][e].id_episode, and use that for the next step.
    // For sources, https://www.lookmovie2.to/api/v1/security/movie-access?id_movie=148123&expires=1779856121
    // or shows: https://www.lookmovie2.to/api/v1/security/episode-access?id_episode=52124&expires=1779856242

    try {
        const SOURCE_ORDER = ["1080p", "720p", "480p", "360p"];
        if(s && e) {
            // Get episode sources
            const showRes = await fetch(`https://lmscript.xyz/v1/shows?filters[q]=${encodeURIComponent(name)}`);
            const showData = await showRes.json();
            const show = showData.items.find((item: any) => (`${item.tmdb_prefix}` === `${tmdbId}` || `${item.tmdb_id}` === `${tmdbId}`));
            if (!show) {
                return new Response("Show not found", { status: 404 });
            }
            const id_show = show.id_show;
            
            const episodeListRes = await fetch(`https://www.lookmovie2.to/api/v2/download/episode/list?id=${id_show}`);
            const episodeListData = await episodeListRes.json();
            const episode = episodeListData.list[s][e];
            if (!episode) {
                return new Response("Episode not found", { status: 404 });
            }
            const id_episode = episode.id_episode;
            
            const sourcesRes = await fetch(`https://www.lookmovie2.to/api/v1/security/episode-access?id_episode=${id_episode}&expires=${Math.floor(Date.now() / 1000) + 3600}`);
            const sourcesData = await sourcesRes.json();
            if(!sourcesData?.success) {
                return new Response("Failed to get sources", { status: 500 });
            }
            const streams = Object.fromEntries(Object.entries(sourcesData.streams).filter(([_, url]) => url));

            const sortedStreams = Object.keys(streams).sort((a, b) => SOURCE_ORDER.indexOf(a) - SOURCE_ORDER.indexOf(b));
            return new Response(JSON.stringify({
                title: `${show.title} S${s}E${e}`,
                tmdbId: show.tmdb_id,
                source: {
                    url: streams[sortedStreams[0]],
                    quality: sortedStreams[0],
                },
            }), { status: 200 });
        } else {
            // Get movie sources
            const movieRes = await fetch(`https://lmscript.xyz/v1/movies?filters[q]=${encodeURIComponent(name)}`);
            const movieData = await movieRes.json();
            const movie = movieData.items.find((item: any) => (`${item.tmdb_prefix}` === `${tmdbId}` || `${item.tmdb_id}` === `${tmdbId}`));
            if (!movie) {
                return new Response("Movie not found", { status: 404 });
            }
            const id_movie = movie.id_movie;
            
            const sourcesRes = await fetch(`https://www.lookmovie2.to/api/v1/security/movie-access?id_movie=${id_movie}&expires=${Math.floor(Date.now() / 1000) + 3600}`);
            const sourcesData = await sourcesRes.json();
            if(!sourcesData?.success) {
                return new Response("Failed to get sources", { status: 500 });
            }
            
            const streams = Object.fromEntries(Object.entries(sourcesData.streams).filter(([_, url]) => url));
            const sortedStreams = Object.keys(streams).sort((a, b) => SOURCE_ORDER.indexOf(a) - SOURCE_ORDER.indexOf(b));
            return new Response(JSON.stringify({
                title: movie.title,
                tmdbId: movie.tmdb_id,
                source: {
                    url: streams[sortedStreams[0]],
                    quality: sortedStreams[0],
                },
            }), { status: 200 });
        }
    } catch {
        return new Response("Failed to fetch data", { status: 500 });
    }
}