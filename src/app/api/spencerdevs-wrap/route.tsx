import { NextRequest, NextResponse } from "next/server";
import { pbkdf2Sync, createDecipheriv } from "crypto";

// eM maps 8-bit binary strings ("00000000".."11111111") → base64 alphabet chars
// Webpack builds this at runtime; we reconstruct it here.
const BASE64_CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=";
const eM: Record<string, string> = {};
for (let i = 0; i < BASE64_CHARS.length; i++) {
    eM[i.toString(2).padStart(8, "0")] = BASE64_CHARS[i];
}

function decryptSnoopdog(snoopdog: string): string {
    // Each whitespace-separated token is a binary string (e.g. "01000001")
    // mapped to a base64 character via eM, then joined into a base64 string.
    const base64Str = snoopdog
        .trim()
        .split(/\s+/)
        .map(token => eM[token] ?? "")
        .join("");

    const buf = Buffer.from(base64Str, "base64");

    const salt   = buf.subarray(0, 32);   // PBKDF2 password
    const kdfSalt = buf.subarray(32, 48); // PBKDF2 salt
    const iv     = buf.subarray(48, 64);  // AES IV
    const cipher = buf.subarray(64);      // ciphertext

    const key = pbkdf2Sync(salt, kdfSalt, 1e5, 32, "sha512");

    const decipher = createDecipheriv("aes-256-cbc", key, iv);
    let decrypted = decipher.update(cipher, undefined, "utf8");
    decrypted += decipher.final("utf8");

    return decrypted;
}

export async function GET(req: NextRequest) {
    const id       = req.nextUrl.searchParams.get("id");
    const season   = req.nextUrl.searchParams.get("s");
    const episode  = req.nextUrl.searchParams.get("e");
    const serverId = req.nextUrl.searchParams.get("serverId");

    // No serverId → tell the client how many servers are available
    if (!serverId) {
        return NextResponse.json({ servers: 25 }, { status: 200 });
    }

    if (!id) {
        return NextResponse.json({ error: "Missing id" }, { status: 400 });
    }

    const type = season && episode ? "tv" : "movie";

    const url =
        type === "tv"
            ? `https://servers.spencerdevs.xyz/${serverId}/t/${id}/${season}/${episode}`
            : `https://servers.spencerdevs.xyz/${serverId}/m/${id}`;

    const headers = {
        Referer:    "https://spencerdevs.xyz/",
        Origin:     "https://spencerdevs.xyz",
        "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.7378.102 Safari/537.36",
    };

    const res = await fetch(url, { headers });
    if (!res.ok) {
        return NextResponse.json(
            { error: `Failed to fetch sources: ${res.status}` },
            { status: res.status }
        );
    }

    const data = await res.json();

    if (!data.snoopdog) {
        return NextResponse.json({ error: "Invalid server response" }, { status: 502 });
    }

    try {
        const streamUrl = decryptSnoopdog(data.snoopdog);
        const isHls =
            streamUrl.includes(".m3u8") ||
            streamUrl.includes(".txt") ||
            streamUrl.includes("playlist");
        
        const streamUrlProxied = `https://api.anyembed.xyz/api/proxy?url=${encodeURIComponent(streamUrl)}&origin=${encodeURIComponent(headers.Origin)}&referer=${encodeURIComponent(headers.Referer)}&headers=${encodeURIComponent(JSON.stringify(headers))}`;

        return NextResponse.json({
            url:     streamUrlProxied,
            type:    isHls ? "hls" : "mp4",
            quality: "auto",
        });
    } catch {
        return NextResponse.json({ error: "Decryption failed" }, { status: 500 });
    }
}