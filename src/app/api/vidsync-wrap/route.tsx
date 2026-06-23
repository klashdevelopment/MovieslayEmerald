// const API_URLS = {
//     sources: "https://vidsync.xyz/api/stream/serverList",
//     // movie: "https://vidsync.xyz/api/stream/fetch?type=movie&title={title}&mediaId={tmdb_id}&releaseYear={year}&serverName={server}",
//     // tv: "https://vidsync.xyz/api/stream/fetch?type=tv&title={title}&mediaId={tmdb_id}&releaseYear={year}&serverName={server}&season={season_number}&episode={episode_number}"
// }

import { NextRequest } from "next/server";

export async function GET(req: NextRequest) {
    const tmdbId = req.nextUrl.searchParams.get("tmdbId");
    const title = req.nextUrl.searchParams.get("title");
    const year = req.nextUrl.searchParams.get("year");
    const server = req.nextUrl.searchParams.get("server");
    const season = req.nextUrl.searchParams.get("s");
    const episode = req.nextUrl.searchParams.get("e");

    if (!tmdbId || !title || !year || !server) {
        return new Response(JSON.stringify({ error: "Missing required parameters tmdbId. title. year. or server." }), { status: 400 });
    }

    if(server === 'list') {
        const sourceRes = await fetch("https://vidsync.xyz/api/stream/serverList");
        const sourceJson = await sourceRes.json();
        return new Response(JSON.stringify(sourceJson), { status: 200 });
    }

    const type = season && episode ? "tv" : "movie";
    const url = `https://vidsync.xyz/api/stream/fetch?type=${type}&title=${encodeURIComponent(title).replace(/%20/g, '+')}&mediaId=${tmdbId}&releaseYear=${year}&serverName=${server}${season ? `&season=${season}` : ""}${episode ? `&episode=${episode}` : ""}`;

    const encryptUrl = `https://enc-dec.app/api/enc-vidsync`;
    const cfRes = await fetch(encryptUrl);
    const cfJson = await cfRes.json();

    if(!cfJson.token) {
        return new Response(JSON.stringify({ error: "Failed to gen CF token" }), { status: 500 });
    }

    const res = await fetch(url, {
        method: "GET",
        headers: {
            "Accept": "*/*",
            "Origin": "https://vidsync.xyz",
            "Referer": "https://vidsync.xyz/",
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0.0.0 Safari/537.36",
            "X-Requested-With": "XMLHttpRequest",
            "X-Cf-Turnstile": cfJson.token,
        }
    });
    const encrypted = await res.text();

    const decryptUrl = `https://enc-dec.app/api/dec-vidsync`;
    const decryptRes = await fetch(decryptUrl, {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({ text: encrypted, id: tmdbId })
    });
    const decrypted = await decryptRes.json();
    return new Response(JSON.stringify(decrypted), { status: 200 });
}