export const sources: {
    [key: string]: {
        series: string;
        movie: string;
        tooltip: string;
        tags?: string[];
        icon?: string;
    };
} = { // first 4 are displayed.
    "movieslay": {
        "series": "/player/%HOME_DATA%",
        "movie": "/player/%HOME_DATA%",
        "tooltip": "Movieslay (Best, ad-free, beta)",
        "tags": ["recommended", "ad-free", "beta"],
        "icon": "/assets/source_icon.png"
    },
    "vyla": { // could move to vyla.cc soon
        "series": "https://1c34-x.hf.space/?id=%id%&season=%sid%&episode=%eid%",
        "movie": "https://1c34-x.hf.space/?id=%id%",
        "tooltip": "Vyla (partner, ad-free)",
        "tags": ["recommended", "partner", "ad-free"],
        "icon": "/assets/vyla-api-logo.png"
    },
    "111movies": {
        "series": "https://111movies.net/tv/%id%/%sid%/%eid%",
        "movie": "https://111movies.net/movie/%id%",
        "tooltip": "111Movies (New, beta)",
        "tags": ["new", "beta", "ads"]
    },
    "vidcore": {
        "series": "https://vidcore.net/tv/%id%/%sid%/%eid%",
        "movie": "https://vidcore.net/movie/%id%",
        "tooltip": "VidCore (Regular)",
        "tags": ["regular", "ads"]
    },
    "videasy": {
        "series": "https://player.videasy.net/tv/%id%/%sid%/%eid%",
        "movie": "https://player.videasy.net/movie/%id%",
        "tooltip": "Videasy (Regular)",
        "tags": ["regular", "ads"]
    },
    "vidapi": {
        "series": "https://vaplayer.ru/embed/tv/%id%/%sid%/%eid%?color=%23615fff",
        "movie": "https://vaplayer.ru/embed/movie/%id%?color=%23615fff",
        "tooltip": "VidAPI (Regular)",
        "tags": ["regular", "ads"]
    },
    "vsrc2": {
        "series": "https://vidsrc.cc/v2/embed/tv/%id%/%sid%/%eid%?autoPlay=true",
        "movie": "https://vidsrc.cc/v2/embed/movie/%id%?autoPlay=true",
        "tooltip": "VSrc2 (Great)",
        "tags": ["regular", "hd", "ads"]
    },
    "2embed": {
        "series": "https://www.2embed.cc/embedtv/%id%&s=%sid%&e=%eid%",
        "movie": "https://www.2embed.cc/embed/%id%",
        "tooltip": "2Embed (Regular)",
        "tags": ["regular", "ads"]
    },
    "vidsrc": {
        "series": "https://vsembed.ru/embed/tv?tmdb=%id%&season=%sid%&episode=%eid%",
        "movie": "https://vsembed.ru/embed/movie?tmdb=%id%",
        "tooltip": "VSrc1 (Regular)",
        "tags": ["regular", "ads"]
    },
    "vidrock": {
        "series": "https://vidrock.ru/tv/%id%/%sid%/%eid%?autoplay=true&theme=%23615fff&nextbutton=false&episodeselector=false",
        "movie": "https://vidrock.ru/movie/%id%?autoplay=true&theme=%23615fff",
        "tooltip": "VidRock (Regular)",
        "tags": ["regular", "ads"]
    },
    "smashy": {
        "series": "https://player.smashystream.com/tv/%id%?s=%sid%&e=%eid%",
        "movie": "https://player.smashystream.com/movie/%id%",
        "tooltip": "Smashy (Bad popups)",
        "tags": ["regular", "slow", "ads"]
    },
};
export default sources;
