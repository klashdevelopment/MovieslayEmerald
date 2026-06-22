import { NextRequest, NextResponse } from "next/server";
import { useTMDB } from "../get-movies/tmdb-help";
import getAnimeMap from "../anime-map/map";

const BASE = "https://123anime.info";
const TS = "1";
const AE_PROXY = "https://api.anyembed.xyz/api/proxy";
const ECHO_ORIGIN = "https://play2.echovideo.ru";
const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36";

type AnimeResult = { slug: string; label: string };
type Source = { label: string; m3u8: string };

function aeProxyUrl(url: string): string {
    const headers = JSON.stringify({
        Origin: ECHO_ORIGIN,
        Referer: ECHO_ORIGIN + "/",
        "User-Agent": UA,
    });
    return `${AE_PROXY}?url=${encodeURIComponent(url)}&headers=${encodeURIComponent(headers)}&origin=${encodeURIComponent(ECHO_ORIGIN)}&referer=${encodeURIComponent(ECHO_ORIGIN + "/")}`;
}

function proxyUrl(url: string): string {
    return `/api/123anime-proxy?prx_url=${encodeURIComponent(url)}`;
}

async function expandM3u8(rawUrl: string, label: string): Promise<Source[]> {
    let text: string;
    try {
        const res = await fetch(aeProxyUrl(rawUrl));
        text = await res.text();
    } catch {
        return [{ label, m3u8: proxyUrl(rawUrl) }];
    }

    const variantRegex = /RESOLUTION=\d+x(\d+)[^\n]*\n([^\n]+)/g;
    const variants: Source[] = [];
    let match;
    while ((match = variantRegex.exec(text)) !== null) {
        const height = match[1];
        const segUrl = match[2].trim();
        const absUrl = segUrl.startsWith("http") ? segUrl : new URL(segUrl, rawUrl).href;
        const finalUrl = absUrl.startsWith(AE_PROXY) ? proxyUrl(
            absUrl.replace(AE_PROXY + "?url=", "").split(".m3u8")[0] + ".m3u8"
        ) : proxyUrl(absUrl);
        variants.push({ label: `${label} ${height}p`, m3u8: finalUrl });
    }

    return variants.length > 0 ? variants : [{ label, m3u8: proxyUrl(rawUrl) }];
}

async function searchSlugs(title: string): Promise<AnimeResult[]> {
    const res = await fetch(
        `${BASE}/ajax/film/search?sort=year%3Adesc&keyword=${encodeURIComponent(title)}&ts=${TS}&_=${Date.now()}`
    );
    const { html } = await res.json();

    const matches = [...html.matchAll(/href="\/anime\/([^"]+)"[^>]*>([^<]+)</g)];
    if (!matches.length) return [];

    if(!html.split('fa-calendar')[0].includes('">' +title)) {
        return [];
    }

    const normalize = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, "");
    const target = normalize(title);

    const results: AnimeResult[] = [];
    for (const [, slug, linkText] of matches) {
        const normText = normalize(linkText);
        if (normText === target || normText.includes(target)) {
            const label = slug.endsWith("-dub") ? "Dub" : "Sub";
            results.push({ slug, label });
        }
    }

    return results.sort((a) => (a.label === "Sub" ? -1 : 1));
}

async function getEpisodeSource(
    slug: string,
    season: number,
    episode: number
): Promise<string | null> {
    const infoRes = await fetch(
        `${BASE}/ajax/episode/info?epr=${slug}%2F${season}%2F${episode}&ts=${TS}&_=${Date.now()}`
    );
    const info = await infoRes.json();
    if (!info.target) return null;

    const embedUrl = new URL(info.target);
    const id = embedUrl.pathname.split("/").pop();
    const sourcesRes = await fetch(
        `https://play2.echovideo.ru/hs/getSources?id=${id}`
    );
    const sources = await sourcesRes.json();

    return sources.sources ?? null;
}

export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const tmdbId = searchParams.get("id");
    const season = parseInt(searchParams.get("s") ?? "1");
    const episode = parseInt(searchParams.get("e") ?? "1");

    if (!tmdbId) return NextResponse.json({ error: "Missing id" }, { status: 400 });

    const animeMap = await getAnimeMap(tmdbId);
    if(!animeMap.found_on) return NextResponse.json({ error: "Show is not anime according to fribb map" }, { status: 404 });

    const tmdb = await useTMDB(`tv/${tmdbId}`);
    if (!tmdb?.name) return NextResponse.json({ error: "TMDB fetch failed" }, { status: 500 });
    const searchTitle = tmdb.name.split(" ").slice(0, -1).join(" ");

    const animeResults = await searchSlugs(searchTitle);
    if (!animeResults.length) return NextResponse.json({ error: "Anime not found on 123anime" }, { status: 404 });

    const rawSources = await Promise.all(
        animeResults.map(async ({ slug, label }) => {
            const m3u8 = await getEpisodeSource(slug, season, episode);
            return m3u8 ? { label, m3u8 } : null;
        })
    );

    const valid = rawSources.filter(Boolean) as { label: string; m3u8: string }[];
    if (!valid.length) return NextResponse.json({ error: "Source not found" }, { status: 404 });

    // Expand any master manifests into per-quality sources
    const expanded = (await Promise.all(
        valid.map(({ label, m3u8 }) => expandM3u8(m3u8, label))
    )).flat();

    return NextResponse.json({ sources: expanded });
}