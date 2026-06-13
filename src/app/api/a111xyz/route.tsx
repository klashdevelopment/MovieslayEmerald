import { NextRequest, NextResponse } from "next/server";

const BASE_URL = "https://a.111477.xyz";
const PROXY_URL = "https://p.111477.xyz/bulk?u=";

const folders = {
    movie: 'movies',
    tv: 'tv',
    _anime: 'misc/anime',
    _games: 'misc/games',
    _books: 'misc/books',
    _edu: 'misc/edu',
    _kdrama: 'kdrama',
    _asiandrama: 'asiandrama',
}

export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const name = searchParams.get("name");
    const year = searchParams.get("year");

    if (!name || !year) {
        return NextResponse.json({ error: "Missing name or year parameter" }, { status: 400 });
    }

    const s = searchParams.get("s");
    const e = searchParams.get("e");

    let type: 'movie' | 'tv' = "movie";
    if (s && e) {
        type = "tv";
    }

    try {
        const URL = `${BASE_URL}/${folders[type] || 'movies'}/${encodeURIComponent(name)}%20(${year})/`;
        console.log(URL);
        const res = await fetch(URL);
        // if (!res.ok) {
        //     return NextResponse.json({ error: "Failed to fetch content folder from a111477" }, { status: 500 });
        // }
        const text = await res.text();
        console.log(text);
        const pattern = /onclick="downloadViaProxy\(event,'([^']+)'\)"/g;

        const files = [...text.matchAll(pattern)].map(match => {
            const path = match[1];
            const filename = decodeURIComponent(path.split('/').pop() || 'unknown');
            return { filename, path };
        });

        return NextResponse.json({ files: files.map(f => ({ label: f.filename, url: PROXY_URL + encodeURIComponent(BASE_URL + f.path) })) });
    } catch (error) {
        return NextResponse.json({ error: "Failed to fetch from a111477" }, { status: 500 });
    }
}