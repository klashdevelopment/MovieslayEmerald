export class VylaAPI {
    static async search(tmdbId: string, type: 'tv' | 'movie', season?: number|undefined, episode?: number|undefined) {
        const params = new URLSearchParams({ id: tmdbId, type });
        if (season) params.append("s", season.toString());
        if (episode) params.append("e", episode.toString());

        const response = await fetch(`/api/vyla-wrap?${params.toString()}`);
        if (!response.ok) {
            throw new Error(`Vyla API error: ${response.statusText}`);
        }
        return await response.json();
    }
}