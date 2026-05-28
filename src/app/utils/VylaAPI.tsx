export class VylaAPI {
    static async search(tmdbId: string, type: 'tv' | 'movie', source?: {
        label: string;
        key: string;
        timeout: number;
    }|undefined, season?: number|undefined, episode?: number|undefined) {
        const params = new URLSearchParams({ id: tmdbId, type });
        if (source) params.append("source", source.key);
        if (source) params.append("timeout", source.timeout.toString());
        if (season) params.append("s", season.toString());
        if (episode) params.append("e", episode.toString());

        const response = await fetch(`/api/vyla-wrap?${params.toString()}`);
        if (!response.ok) {
            throw new Error(`Vyla API error: ${response.statusText}`);
        }
        return await response.json();
    }

    static async getSources() {
        const response = await fetch(`/api/vyla-wrap?sources=true`);
        if (!response.ok) {
            throw new Error(`Vyla API error: ${response.statusText}`);
        }
        const data = await response.json();
        return data.sources || [];
    }

    static async getSubtitles(tmdbId: string, type: 'tv' | 'movie', season?: number|undefined, episode?: number|undefined) {
        const params = new URLSearchParams({ id: tmdbId, type, source: 'subtitles' });
        if (season) params.append("s", season.toString());
        if (episode) params.append("e", episode.toString());

        const response = await fetch(`/api/vyla-wrap?${params.toString()}`);
        if (!response.ok) {
            throw new Error(`Vyla API error: ${response.statusText}`);
        }
        return await response.json();
    }
}