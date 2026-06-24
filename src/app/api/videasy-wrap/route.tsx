import { NextRequest, NextResponse } from "next/server";

const HEADERS = {
    "Accept": "*/*",
    "Origin": "https://player.videasy.to",
    "Referer": "https://player.videasy.to/",
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0.0.0 Safari/537.36"
};

const ENCDEC_API = "https://enc-dec.app/api";
const VIDEASY_API = "https://api.videasy.to/";

async function getImdbId(type: string, id: string, name: string, year: string): Promise<string> {
    const res = await fetch(`https://api.anyembed.xyz/api/meta?tmdb_id=${id}&title=${encodeURIComponent(name)}&year=${year}&type=${type}`);
    const json = await res.json();
    return json.imdb_id;
}

export async function GET(req: NextRequest) {
    const params = req.nextUrl.searchParams;
    const s = params.get('s');
    const e = params.get('e');
    const id = params.get('id') || '1';
    const server = params.get('server') || 'tik';
    const name = params.get('name') || 'Unknown';
    const year = params.get('year') || 'Unknown';

    if(server === 'list') return NextResponse.json({
        servers: [{ label: 'Neon', id: 'mb-flix' }, { label: 'Yoru', id: 'cdn' }, { label: 'Cypher', id: 'downloader2' }, { label: 'Sage', id: '1movies' }, { label: 'Breach', id: 'm4uhd' }, { label: 'Vyse', id: 'hdmovie' }, { label: 'German', id: 'meine' }, { label: 'Spanish', id: 'lamovie' }, { label: 'Portuguese', id: 'superflix' }]
    });

    if(!id) return NextResponse.json({"no id":"no id"}, {status: 402})

    try {
        const type = (s && e) ? 'tv' : 'movie'
        const imdbId = await getImdbId(type, id, name, year);

        const URL = `https://api.videasy.to/${server}/sources-with-title?title=${encodeURIComponent(name)}&mediaType=${type}&year=${year}${type === 'tv' ? `&episodeId=${e}&seasonId=${s}` : ''}&tmdbId=${id}&imdbId=${imdbId}`;

        const res = await fetch(URL, {
            method: "GET",
            headers: HEADERS
        });
        const raw = await res.text();

        const encRes = await fetch(ENCDEC_API + '/dec-videasy', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ text: raw, id: id })
        });
        const encJson = await encRes.json();
        if(encJson.status !== 200) {
            return NextResponse.json({ error: "Failed to decrypt data" }, { status: 500 });
        }
        return NextResponse.json({
            streams: encJson.result.sources.map((s: any) => ({
                label: s.quality,
                url: `https://api.anyembed.xyz/api/proxy?url=${encodeURIComponent(s.url)}&headers={"Origin":"https://player.videasy.to","Referer":"https://player.videasy.to/"}&Origin=https://player.videasy.to&Referer=https://player.videasy.to/`
            })),
            subtitles: encJson.result.subtitles.map((s: any) => ({
                label: s.language,
                url: s.url
            }))
        });
    } catch (err) {
        console.error(err);
        return NextResponse.json({ error: "Internal error" }, { status: 500 })
    }
}