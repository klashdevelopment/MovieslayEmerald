export interface FebboxReply {
    streams: {
        [key: string]: { // url is quality, "360P", "720P", "1080P"
            type: 'hls' | string;
            url: string;
        }
    },
    subtitles: {
        [key: string]: {
            subtitle_link: string;
            subtitle_name: string;
        }
    };
}

export class FebboxAPI {
    static async search(title: string, year?: string | number, season?: number, episode?: number): Promise<FebboxReply> {
        const url = new URL("/api/feddb-wrap", process.env.NEXT_PUBLIC_BASE_URL || window.location.origin);
        url.searchParams.set("name", title);
        if (year) url.searchParams.set("year", String(year));

        if (season) url.searchParams.set("season", String(season));
        if (episode) url.searchParams.set("episode", String(episode));

        const res = await fetch(url.toString());
        if (!res.ok) throw new Error(`Failed to search Febbox: ${res.status}`);
        return res.json();
    }
}