export interface MediaType {
    media_type: 'person' | 'movie' | 'tv' | 'series';
    adult: boolean;
    original_language: string;
    popularity: number;
    vote_average: number;
    vote_count: number;
    backdrop_path: string | null;
    poster_path: string | null;
    id: number;
}

export interface Movie extends MediaType {
    id: number;
    title: string;
    original_title: string;
    overview: string;
    release_date: string;
    video: boolean;
    media_type: 'movie';
    genre_ids: number[];
}

export interface TVShow extends MediaType {
    id: number;
    name: string;
    original_name: string;
    overview: string;
    first_air_date: string;
    media_type: 'series';
    origin_country: string[];
}

export interface Person extends MediaType {
    id: number;
    name: string;
    original_name: string;
    media_type: 'person';
    adult: boolean;
    popularity: number;
    gender: number;
    known_for_department: string;
    profile_path: string | null;
    known_for: (Movie | TVShow)[];
}

export interface SearchResults {
    page: number;
    results: MediaType[];
}

export function getNameOrTitle(media: MediaType): string {
    switch (media.media_type) {
        case 'movie':
            return (media as Movie).title;
        case 'series':
        case 'tv':
            return (media as TVShow).name;
        case 'person':
            return (media as Person).name;
        default:
            return '';
    }
}