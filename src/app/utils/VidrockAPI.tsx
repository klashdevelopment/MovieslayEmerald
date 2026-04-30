export class VidrockAPI {
    static async search(tmdbId: string, type: "movie" | "tv", season?: string, episode?: string) {
        const params = new URLSearchParams({ tmdb: tmdbId, type });
        if (season) params.append("s", season);
        if (episode) params.append("e", episode);

        const response = await fetch(`/api/vidrock-wrap?${params.toString()}`);
        if (!response.ok) {
            throw new Error(`Vidrock API error: ${response.statusText}`);
        }
        return await response.json();
    }
}