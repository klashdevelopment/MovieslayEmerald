let sourcesCache: { data: any[]; expiresAt: number } | null = null;

export async function getVylaSources(): Promise<any[]> {
    if (sourcesCache && sourcesCache.expiresAt > Date.now()) {
        return sourcesCache.data;
    }
    const response = await fetch(`https://missourimonster-vyla.hf.space/api/health`, {
        headers: { "Cache-Control": "public, max-age=3600" }
    });
    if (!response.ok) throw new Error(`Error fetching health: ${response.statusText}`);
    const data = await response.json();
    const sources = Object.entries(data.sources)
        .filter(([_, info]: any) => info.ok)
        .map(([name, _]: any) => name);
    sourcesCache = { data: sources, expiresAt: Date.now() + 3600000 };
    return sources;
}

export async function getVylaSubtitles(id: string, type: "movie" | "tv" = "tv", s?: string | null, e?: string | null) {
    const url = type === "movie"
        ? `https://missourimonster-vyla.hf.space/api/subtitles/movie/${id}`
        : `https://missourimonster-vyla.hf.space/api/subtitles/tv/${id}/s/${s}/e/${e}`;
    const response = await fetch(url);
    if (!response.ok) throw new Error(`Error fetching subtitles: ${response.statusText}`);
    return response.json();
}

export async function getVyla(id: string, type: "movie" | "tv" = "tv", s?: string | null, e?: string | null, source?: string | null) {
    if (!id || (type === "tv" && (!s || !e))) {
        throw new Error("Missing parameters");
    }
    if (source === 'subtitles') {
        return getVylaSubtitles(id, type, s, e);
    }
    let url = type === "movie"
        ? `https://missourimonster-vyla.hf.space/api/movie?id=${id}`
        : `https://missourimonster-vyla.hf.space/api/tv?id=${id}&season=${s}&episode=${e}`;
    if (source) {
        url = type === "movie"
            ? `https://missourimonster-vyla.hf.space/api/test/${id}?source=${source}`
            : `https://missourimonster-vyla.hf.space/api/test/${id}?season=${s}&episode=${e}&source=${source}`;
    }
    const response = await fetch(url);
    if (!response.ok) throw new Error(`Error fetching ${url}: ${response.statusText}`);
    return response.json();
}