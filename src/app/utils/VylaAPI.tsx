export class VylaAPI {
    static async search(tmdbId: string, type: 'tv' | 'movie', season?: string, episode?: string) {
        const params = new URLSearchParams({ id: tmdbId, type });
        if (season) params.append("s", season);
        if (episode) params.append("e", episode);

        const response = await fetch(`/api/vyla-wrap?${params.toString()}`);
        if (!response.ok) {
            throw new Error(`Vyla API error: ${response.statusText}`);
        }
        return await response.json();
    }
}