let sourcesCache: { data: any[]; expiresAt: number } | null = null;

export async function getVylaSources(): Promise<any[]> {
    if (sourcesCache && sourcesCache.expiresAt > Date.now()) {
        return sourcesCache.data;
    }
    // Vyla is literally the GOAT thank you SO much
    const response = await fetch(`https://missourimonster-movieslay.hf.space/api?sources_meta`, {
        headers: { "Cache-Control": "public, max-age=3600" }
    });
    if (!response.ok) throw new Error(`Error fetching health: ${response.statusText}`);
    const data = await response.json();
    const sources = (data.sources || []).map((source: any) => ({
        label: source.label,
        key: source.key,
        timeout: source.timeout || 30000,
    }));
    sourcesCache = { data: sources, expiresAt: Date.now() + 3600000 };
    return sources;
}

export async function getVylaSubtitles(id: string, type: "movie" | "tv" = "tv", s?: string | null, e?: string | null) {
    const url = type === "movie"
        ? `https://missourimonster-movieslay.hf.space/api/subtitles/movie/${id}`
        : `https://missourimonster-movieslay.hf.space/api/subtitles/tv/${id}/s/${s}/e/${e}`;
    const response = await fetch(url);
    if (!response.ok) throw new Error(`Error fetching subtitles: ${response.statusText}`);
    return response.json();
}

export async function getVyla(id: string, type: "movie" | "tv" = "tv", s?: string | null, e?: string | null, source?: string | null, timeout?: string | null) {
    if (!id || (type === "tv" && (!s || !e))) {
        throw new Error("Missing parameters");
    }
    if (source === 'subtitles') {
        return getVylaSubtitles(id, type, s, e);
    }
    let url = type === "movie"
        ? `https://missourimonster-movieslay.hf.space/api/movie?id=${id}`
        : `https://missourimonster-movieslay.hf.space/api/tv?id=${id}&season=${s}&episode=${e}`;
    if (source) {
        url = type === "movie"
            ? `https://missourimonster-movieslay.hf.space/api/test/${id}?source=${source}`
            : `https://missourimonster-movieslay.hf.space/api/test/${id}?season=${s}&episode=${e}&source=${source}`;
    }
    const response = await fetch(url, {
        headers: {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/92.0.4515.131 Safari/537.36 MovieslayDotCom/PleaseContactMe OnDiscord/gavingogaming",
            ...(timeout ? { "X-Timeout": timeout } : {})
        },
        signal: timeout ? AbortSignal.timeout(parseInt(timeout)) : undefined,
    });
    if (!response.ok) throw new Error(`Error fetching ${url}: ${response.statusText}`);
    return response.json();
}