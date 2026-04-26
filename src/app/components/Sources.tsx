export const sources: {
    [key: string]: {
        series: string;
        movie: string;
        tooltip: string;
    };
} = { // first 4 are displayed.
    "111movies": {
        "series": "https://111movies.net/tv/%id%/%sid%/%eid%",
        "movie": "https://111movies.net/movie/%id%",
        "tooltip": "111Movies (New, beta)"
    },
    "vidcore": {
        "series": "https://vidcore.net/tv/%id%/%sid%/%eid%",
        "movie": "https://vidcore.net/movie/%id%",
        "tooltip": "VidCore (Regular)"
    },
    "videasy": {
        "series": "https://player.videasy.net/tv/%id%/%sid%/%eid%",
        "movie": "https://player.videasy.net/movie/%id%",
        "tooltip": "Videasy (Regular)"
    },
    "2embed": {
        "series": "https://www.2embed.cc/embedtv/%id%&s=%sid%&e=%eid%",
        "movie": "https://www.2embed.cc/embed/%id%",
        "tooltip": "2Embed (Regular)"
    },
    "vsrc2": {
        "series": "https://vidsrc.cc/v2/embed/tv/%id%/%sid%/%eid%?autoPlay=true",
        "movie": "https://vidsrc.cc/v2/embed/movie/%id%?autoPlay=true",
        "tooltip": "VSrc2 (Great)"
    },
    "vidsrc": {
        "series": "https://vsembed.ru/embed/tv?tmdb=%id%&season=%sid%&episode=%eid%",
        "movie": "https://vsembed.ru/embed/movie?tmdb=%id%",
        "tooltip": "VSrc1 (Regular)"
    },
    "smashy": {
        "series": "https://player.smashystream.com/tv/%id%?s=%sid%&e=%eid%",
        "movie": "https://player.smashystream.com/movie/%id%",
        "tooltip": "Smashy (Bad popups)"
    },
};
export default sources;
