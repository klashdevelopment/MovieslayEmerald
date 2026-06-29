import exclusives from "./Exclusives";

export async function getMovies(page: number, type?: string, customKey?: string) {
    const response = await fetch(`/api/get-movies?page=${page}${customKey ? '&apiKey='+customKey : ''}${type ? '&type='+type : ''}`);
    const data = await response.json();
    return data;
}
export async function getSearch(query: string, page?: number, customKey?: string) {
    const response = await fetch(`/api/get-movies?type=search&query=${encodeURIComponent(query)}&page=${page||'1'}${customKey ? '&apiKey='+customKey : ''}`);
    const data = await response.json();
    exclusives.forEach((exclusive) => {
        if (exclusive.title.toLowerCase().includes(query.toLowerCase())) {
            data.results.unshift({
                id: exclusive.id,
                title: exclusive.title,
                overview: exclusive.description,
                poster_path: exclusive.image,
                adult: false,
                backdrop_path: exclusive.image,
                genre_ids: [],
                original_language: 'en',
                original_title: exclusive.title,
                popularity: 0,
                release_date: '',
                video: false,
                vote_average: 0,
                vote_count: 0,
                type: exclusive.type
            });
        }
    });
    return data;
}
export async function getSeasonData(series: number, season: number, customKey?: string) {
    const response = await fetch(`/api/season-data?series=${series}&season=${season}${customKey ? '&apiKey='+customKey : ''}`);
    const data = await response.json();
    return data;
}