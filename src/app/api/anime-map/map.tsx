const OTAKU_URL = "https://github.com/Goldenfreddy0703/Otaku-Mappings/raw/refs/heads/main/anime_mappings.db"; // sql so unused rn

const FRIBB_URL = "https://raw.githubusercontent.com/Fribb/anime-lists/refs/heads/master/anime-list-full.json";

export default async function getAnimeMap(tmdbId: string) {
    let results = {
        tvdb: {
            id: null
        },
        anime_planet_id: null,
        anisearch_id: null,
        animecountdown_id: null,
        animenewsnetwork_id: null,
        anidb_id: null,
        anilist_id: null,
        kitsu_id: null,
        imdbId: null,
        malId: null,
        simklId: null,
        livechartId: null,
        found_on: null
    }

    await Promise.any([
        (async () => {
            const res = await fetch(FRIBB_URL);
            const json = await res.json();
            const element = json.find((b: any) => b.themoviedb_id?.tv === Number(tmdbId));
            if (!element) return;

            element.found_on = "fribb";
            if (element.kitsu_id) results.kitsu_id = element.kitsu_id;
            if (element.anidb_id) results.anidb_id = element.anidb_id;
            if (element.anilist_id) results.anilist_id = element.anilist_id;
            if (element.animecountdown_id) results.animecountdown_id = element.animecountdown_id;
            if (element.animenewsnetwork_id) results.animenewsnetwork_id = element.animenewsnetwork_id;
            if (element["anime-planet_id"]) results.anime_planet_id = element["anime-planet_id"];
            if (element.anisearch_id) results.anisearch_id = element.anisearch_id;
            if (element.imdb_id) results.imdbId = element.imdb_id;
            if (element.livechart_id) results.livechartId = element.livechart_id;
            if (element.mal_id) results.malId = element.mal_id;
            if (element.simkl_id) results.simklId = element.simkl_id;
            if (element.tvdb_id) results.tvdb.id = element.tvdb_id;
        })()
    ]);

    return results;
}