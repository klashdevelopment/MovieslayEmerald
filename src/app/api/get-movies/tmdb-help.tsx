
export async function useTMDB(path: string, customKey?: string) {
    const url = 'https://api.themoviedb.org/3/' + path;
    const options = {
        method: 'GET',
        headers: {
            accept: 'application/json',
            Authorization: 'Bearer ' + (customKey ?? process.env.TMDB_API_KEY),
        },
    };

    const response = await fetch(url, options);
    const data = await response.json();
    return data;
}