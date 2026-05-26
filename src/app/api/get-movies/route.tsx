import { NextResponse } from 'next/server';
import { useTMDB } from './tmdb-help';

async function getMovies(page: number, customKey?: string) {
    const string = `discover/movie?page=${page}&sort_by=popularity.desc&include_adult=false&language=en-US`;
    return await useTMDB(string, customKey);
}
async function getShows(page: number, customKey?: string) {
    const string = `discover/tv?page=${page}&sort_by=popularity.desc&include_adult=false&language=en-US`;
    return await useTMDB(string, customKey);
}
async function getGenres(customKey?: string) {
    const string = `genre/movie/list?language=en-US&include_adult=false`;
    return await useTMDB(string, customKey);
}
async function getGenresTV(customKey?: string) {
    const string = `genre/tv/list?language=en-US&include_adult=false`;
    return await useTMDB(string, customKey);
}
async function getMovie(id: number, customKey?: string) {
    const string = `movie/${id}?language=en-US&include_adult=false`;
    return await useTMDB(string, customKey);
}
async function getTV(id: number, customKey?: string) {
    const string = `tv/${id}?language=en-US&include_adult=false`;
    return await useTMDB(string, customKey);
}
async function getMultiple(entries: {type: string, id: number}[], customKey?: string) {
    const promises = entries.map(entry => {
        if(entry.type === 'movie') {
            return getMovie(entry.id, customKey);
        } else if(entry.type === 'tv') {
            return getTV(entry.id, customKey);
        } else {
            return Promise.resolve(null);
        }
    });
    return await Promise.all(promises);
}

async function getFromGenre(type: string, genreId: number, page: number, customKey?: string) {
    const string = `discover/${type}?with_genres=${genreId}&page=${page}&sort_by=popularity.desc&include_adult=false&language=en-US`;
    return await useTMDB(string, customKey);
}

async function getFromType(type: string, page: any, customKey?: string) {
    switch (type) {
        case 'discover':
            return await getMovies(page, customKey);
        case 'genres':
            return await getGenres(customKey);
        case 'discover-tv':
            return await getShows(page, customKey);
        case 'genres-tv':
            return await getGenresTV(customKey);
        case 'movie':
            return await getMovie(page, customKey);
        case 'tv':
            return await getTV(page, customKey);
        case 'trending-week-movie': 
            return await useTMDB('trending/movie/week', customKey);
        case 'trending-week-tv':
            return await useTMDB('trending/tv/week', customKey);
        case 'person':
            return await useTMDB('person/'+page, customKey);
        case 'person-credits':
            return await useTMDB('person/'+page+'/combined_credits', customKey);
        default: // 'discover'
            return await getMovies(page, customKey);
    }
}

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') ?? '1', 10);
    const customApiKey = searchParams.get('apiKey') || undefined;
    const type = searchParams.get('type') || 'discover';

    if(type === 'search') {
        const query = searchParams.get('query') || '';
        const string = `search/multi?query=${query}&page=${page}&include_adult=false&language=en-US&certification_country=US&certification.lte=PG-13`;
        var dataSearch = await useTMDB(string, customApiKey);
        return NextResponse.json(dataSearch);
    }

    if(type === 'discover-genre') {
        const genreId = parseInt(searchParams.get('genreId') ?? '0', 10);
        if(!genreId) {
            return NextResponse.json({ error: 'Missing genreId parameter' }, { status: 400 });
        }
        const dataGenre = await getFromGenre('movie', genreId, page, customApiKey);
        return NextResponse.json(dataGenre);
    }

     if(type === 'discover-tv-genre') {
        const genreId = parseInt(searchParams.get('genreId') ?? '0', 10);
        if(!genreId) {
            return NextResponse.json({ error: 'Missing genreId parameter' }, { status: 400 });
        }
        const dataGenre = await getFromGenre('tv', genreId, page, customApiKey);
        return NextResponse.json(dataGenre);
    }

    const data = await getFromType(type, page, customApiKey);
    return NextResponse.json(data);
}

export async function POST(request: Request) {
    const { searchParams } = new URL(request.url);
    const customApiKey = searchParams.get('apiKey') || undefined;
    const body = await request.json();
    const data = await getMultiple(body.entries, customApiKey);
    return NextResponse.json(data);
}