import { NextRequest, NextResponse } from "next/server";

const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36";
interface Ticket { exp: number, ticket: string };

async function getTicket(): Promise<Ticket> {
    const data = await fetch("https://api.flickystream.su/api/streams/ticket", {
        method: "POST",
        body: "{}", // needed
        referrer: "https://flickystream.su/",
        headers: {
            "Content-Type": "application/json",
            "Orgin": "https://flickystream.su",
            "Referer": "https://flickystream.su/",
            "User-Agent": UA
        }
    });
    const json = await data.json();

    return json;
}

const OPTIONS = {
    method: "GET",
    headers: {
        "User-Agent": UA,
        "Origin": "https://flickystream.su",
        "Referer": "https://flickystream.su/"
    },
    referrer: "https://flickystream.su/"
};

async function getObfKey(): Promise<string> {
    const BACKUP = "mT7xQ2vL9aKf4Rw8Nz1HyC6pUd3Jg0BsV5eYk7Mq2Ln9Xt4Dh1PrW8cFz6Au0Gi3KbV5sQy1Ne7Lm4Tx9Hp2Rd8Zj6Cv0Wk3FaU5nBg1Yq7Ms4Xe9Lt2Hr8Dp6Jv0"; // 6/13/26

    const pageRes = await fetch('https://flickystream.su/player/movie/1339713', OPTIONS);
    const html = await pageRes.text();

    const indexJsMatch = html.match(/\/assets\/(index-[^"']+\.js)/);
    if (!indexJsMatch) return BACKUP;

    const jsRes = await fetch(`https://flickystream.su/assets/${indexJsMatch[1]}`, OPTIONS);
    const firstLine = (await jsRes.text()).split('\n')[0];

    const allFiles = [...firstLine.matchAll(/"(assets\/[^"]+\.js)"/g)].map(m => m[1]);
    const playerFile = allFiles.find(s => /player/i.test(s) || /stream/i.test(s) || /embed/i.test(s) || /watch/i.test(s));
    if (!playerFile) return BACKUP;

    const playerText = await fetch(`https://flickystream.su/${playerFile}`, OPTIONS).then(r => r.text());

    const key = playerText.match(/VITE_STREAM_OBF_KEY[^"'`]*["'`]([a-zA-Z0-9]{40,})/)?.[1]
        ?? playerText.match(/["'`]([a-zA-Z0-9]{80,})["'`]/)?.[1];
    if (!key) return BACKUP;

    return key;
}

// Cache system because their own code mentions a future "multi use token" and it has a .exp
// let CACHED_TICKET: Ticket | null = null;
async function getTicketOrCached(): Promise<Ticket> {
    // if(!CACHED_TICKET || (CACHED_TICKET.exp < Date.now())) {
    //     CACHED_TICKET = await getTicket();
    // }
    // return CACHED_TICKET;
    return await getTicket();
}

export async function GET(req: NextRequest) {
    const params = req.nextUrl.searchParams;
    const s = params.get('s');
    const e = params.get('e');
    const id = params.get('id') || 1;
    const server = params.get('server') || 'tik';

    if(server === 'list') return NextResponse.json({
        servers: ['tik', 'ipcloud', 'pseudo', 'v4_English', 'v4_Hindi', 'v6_Hindi']
    });

    if(!id) return NextResponse.json({"no id":"no id"}, {status: 402})

    try {
        const ticket = await getTicketOrCached();

        const type = (s && e) ? 'tv' : 'movie'
        let URL = `https://api.flickystream.su/api/streams/${type}/${id}${s ? '/' + s : ''}${e ? '/' + e : ''}?s=${server.replace('_', ':')}`;

        const res = await fetch(URL, {
            method: "GET",
            headers: {
                "X-Stream-Ticket": ticket.ticket,
                "User-Agent": UA,
                "Origin": "https://flickystream.su",
                "Referer": "https://flickystream.su/",
                "Authorization": `Bearer ${ticket.ticket}`
            },
            referrer: "https://flickystream.su/"
        });
        const raw = await res.json();
        const obfKey = await getObfKey();
        console.log(obfKey);
        const enc = new TextEncoder();
        const keyBytes = new Uint8Array(
            await crypto.subtle.digest('SHA-256', enc.encode(obfKey + raw.n)),
        );
        const bin = atob(raw.d);
        const out = new Uint8Array(bin.length);
        for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i) ^ keyBytes[i % keyBytes.length];
        const final = JSON.parse(new TextDecoder().decode(out));
        const rawUrl = final.url;

        const m3u8Res = await fetch(`https://api.anyembed.xyz/api/proxy?url=${encodeURIComponent(rawUrl)}&headers={%22Origin%22:%22https://flickystream.su%22,%22Referer%22:%22https://flickystream.su/%22}`);
        const m3u8Text = await m3u8Res.text();

        if (m3u8Text.includes('#EXT-X-STREAM-INF')) {
            const streams: { label: string; url: string, type: 'hls' | any }[] = [];
            const lines = m3u8Text.split('\n').map(l => l.trim()).filter(Boolean);

            for (let i = 0; i < lines.length; i++) {
                if (lines[i].startsWith('#EXT-X-STREAM-INF')) {
                    const inf = lines[i];
                    const streamUrl = lines[i + 1];
                    if (!streamUrl || streamUrl.startsWith('#')) continue;

                    const resMatch = inf.match(/RESOLUTION=(\d+x\d+)/);
                    const resolution = resMatch?.[1] ?? 'unknown';

                    streams.push({
                        label: `${final.language} ${resolution}`,
                        url: streamUrl,
                        type: 'hls'
                    });
                }
            }

            return NextResponse.json({ streams });
        } else {
            return NextResponse.json({
                streams: [{
                    label: final.language,
                    url: `https://api.anyembed.xyz/api/proxy?url=${encodeURIComponent(rawUrl)}&headers={%22Origin%22:%22https://flickystream.su%22,%22Referer%22:%22https://flickystream.su/%22}`,
                    type: 'hls'
                }]
            });
        }
    } catch (err) {
        return NextResponse.json({ error: "Internal error" }, { status: 500 })
    }
}