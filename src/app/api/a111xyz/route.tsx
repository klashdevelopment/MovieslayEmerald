// import { cacheLife } from "next/dist/server/use-cache/cache-life";
import { NextRequest, NextResponse } from "next/server";

const BASE_URL = "https://a.111477.xyz";
const PROXY_URL = "https://p.111477.xyz/bulk?u=";

const folders = {
    movie: 'movies',
    tv: 'tvs',
    _anime: 'misc/anime',
    _games: 'misc/games',
    _books: 'misc/books',
    _edu: 'misc/edu',
    _kdrama: 'kdrama',
    _asiandrama: 'asiandrama',
}

async function getFiles(name: string, year: string, type: 'movie' | 'tv', s?: string, e?: string) {
    // 'use cache';
    // cacheLife('hours');

    let URL = `${BASE_URL}/${folders[type] || 'movies'}/${encodeURIComponent(name)}${type === 'movie' ? `%20(${year}` : ''})/`;
    if (type === 'tv') {
        URL += `Season ${s}/`
    }
    const res = await fetch(URL);
    const text = await res.text();
    const pattern = /onclick="downloadViaProxy\(event,'([^']+)'\)"/g;

    let files = [...text.matchAll(pattern)].map(match => {
        const path = match[1];
        const filename = decodeURIComponent(path.split('/').pop() || 'unknown');
        return { filename, path };
    });

    if (type === 'tv') {
        if (s == null || e == null) {
            return [];
        }
        const episodePattern = new RegExp(`S${s.padStart(2, '0')}E${e.padStart(2, '0')}`, 'i');
        files = files.filter(f => episodePattern.test(f.filename));
    }

    return files;
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
        const files = await getFiles(name, year, type, s || undefined, e || undefined);

        return NextResponse.json({ files: files.map(f => ({ label: f.filename, url: PROXY_URL + encodeURIComponent(BASE_URL + f.path) })) });
    } catch (error) {
        return NextResponse.json({ error: "Failed to fetch from a111477" }, { status: 500 });
    }
}