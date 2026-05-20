import { NextResponse } from "next/server";

let sourcesCache: { data: any[]; expiresAt: number } | null = null;

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);

    if(searchParams.get('sources') === 'true') {
        try {
            if (sourcesCache && sourcesCache.expiresAt > Date.now()) {
                return NextResponse.json({ sources: sourcesCache.data });
            }
            const response = await fetch(`https://missourimonster-vyla.hf.space/api/health`, {
                headers: { "Cache-Control": "public, max-age=3600" }
            });
            if (!response.ok) {
                throw new Error(`Error fetching health: ${response.statusText}`);
            }
            const data = await response.json();
            const sources = Object.entries(data.sources)
                .filter(([_, info]: any) => info.ok)
                .map(([name, _]: any) => name);
            sourcesCache = { data: sources, expiresAt: Date.now() + 3600000 };
            return NextResponse.json({ sources });
        }
        catch (error: any) {
            return NextResponse.json({ error: error.message }, { status: 500 });
        }
    }
    const id = searchParams.get("id");
    const s = searchParams.get("s");
    const e = searchParams.get("e");
    const type = searchParams.get("type") || "tv";
    const source = searchParams.get("source");

    if (!id || (type === "tv" && (!s || !e))) {
        return NextResponse.json({ error: "Missing parameters" }, { status: 400 });
    }

    if(source==='subtitles') {
        // https://missourimonster-vyla.hf.space/api/subtitles/[movie | tv]/ID/s/e
        const url = type === "movie"
            ? `https://missourimonster-vyla.hf.space/api/subtitles/movie/${id}`
            : `https://missourimonster-vyla.hf.space/api/subtitles/tv/${id}/s/${s}/e/${e}`;
        try {
            const response = await fetch(url);
            if (!response.ok) {
                throw new Error(`Error fetching subtitles: ${response.statusText}`);
            }
            const data = await response.json();
            return NextResponse.json(data);
        } catch (error: any) {
            return NextResponse.json({ error: error.message }, { status: 500 });
        }
    }

    let url = type === "movie"
        ? `https://missourimonster-vyla.hf.space/api/movie?id=${id}`
        : `https://missourimonster-vyla.hf.space/api/tv?id=${id}&season=${s}&episode=${e}`;

    if (source) {
        /*"vidlink": {
        "movie": "/api/test/155?source=vidlink",
        "tv": "/api/test/1396?season=1&episode=1&source=vidlink"
      },*/
        url = type === "movie"
            ? `https://missourimonster-vyla.hf.space/api/test/${id}?source=${source}`
            : `https://missourimonster-vyla.hf.space/api/test/${id}?season=${s}&episode=${e}&source=${source}`;
    }
    try {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`Error fetching ${url}: ${response.statusText}`);
        }
        const data = await response.json();
        return NextResponse.json(data);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}