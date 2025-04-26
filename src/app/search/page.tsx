"use client";
import { Button, Dropdown, Input, Option, Select, Sheet } from "@mui/joy";
import PageLayout from "../components/PageLayout";
import { WavyBackground } from "../components/aceternity/BackgroundWave";
import { useEffect, useState } from "react";
import { getMovies, getSearch } from "../components/useTMDB";
import { useRouter } from "next/navigation";
import { getNameOrTitle, Person, SearchResults, TVShow } from "../api/get-movies/search-types";

export interface TMDBMovie {
    id: number;
    title: string;
    overview: string;
    poster_path: string;
    adult: boolean;
    backdrop_path: string;
    genre_ids: number[];
    original_language: string;
    original_title: string;
    popularity: number;
    release_date: string;
    video: boolean;
    vote_average: number;
    vote_count: number;
}
export interface Genre {
    id: number;
    name: string;
}

export default function MovieIndex() {
    const [results, setResults] = useState<SearchResults | null>(null);

    const router = useRouter();

    function goTo(id: number, type: string) {
        router.push(`/${type.replaceAll('tv','series')}/${id}`);
    }

    const [search, setSearch] = useState<string>('');
    const [timeoutId, setTimeoutId] = useState<NodeJS.Timeout | null>(null);

    function searchChanged(e: React.ChangeEvent<HTMLInputElement>) {
        setSearch(e.target.value);
        if (timeoutId) {
            clearTimeout(timeoutId);
        }
        var t_id = setTimeout(() => {
            updateResults(e.target.value);
        }, 350);
        setTimeoutId(t_id);
    };

    const updateResults = (query: string) => {
        if(query.trim().length === 0) {
            setResults(null);
            document.title = "Movieslay (Emerald) | Search";
            const url = new URL(window.location.href);
            url.searchParams.delete('query');
            window.history.pushState({}, '', url);
            return;
        }
        console.log('Querying for ' + query);
        const url = new URL(window.location.href);
        url.searchParams.set('query', query);
        window.history.pushState({}, '', url);
        document.title = `Movieslay (Emerald) | Search: ${query}`;
        getSearch(query).then((data) => {
            setResults(data);
        });
    };

    useEffect(() => {
        document.title = "Movieslay (Emerald) | Search";
        const query = new URLSearchParams(window.location.search).get('query');
        if (query) {
            setSearch(query);
            updateResults(query);
        }
    }, []);

    return (
        <PageLayout title="Search">
            <Sheet variant={'plain'} sx={{ height: '20%', overflow: 'hidden', marginTop: '8px' }}>
                <WavyBackground style={{ width: '100%', height: '100%' }} colors={[
                    '#34d399',
                    '#10b981',
                    '#059669',
                    '#047857',
                    '#065f46'
                ]}>
                    <h1 className="relative z-10 text-lg md:text-7xl drop-shadow-[0_4px_4px_rgba(0,0,0,0.8)] bg-clip-text text-transparent bg-gradient-to-b from-[#A7F3D0] to-[#A7F3D090] text-center font-sans font-bold">
                        Search
                    </h1>
                </WavyBackground>
            </Sheet>
            <div className="full-w" style={{ height: '20px' }}></div>
            <div className="flex-align-flex-col list-list">
                <div className="flex align justify gap-05">
                    <Select placeholder="Filter by...">
                        <Option value="none">Filtering not yet complete</Option>
                    </Select>
                    <Input placeholder="Search for movies or tv shows..." style={{ width: '100%' }} onChange={searchChanged} value={search} />
                    <Button variant="outlined" color="primary" onClick={() => { updateResults(search) }} startDecorator={<i className="fa-solid fa-magnifying-glass" />}>Search</Button>
                </div>
                <div className="full-w" style={{ height: '20px' }}></div>
                <span>{search ? <>Search results for <b>{search}</b>:</> : <span>Start typing to see results</span>}</span>
                <div className="full-w" style={{ height: '20px' }}></div>
                {results ? (
                    <>
                        <h2>Movies</h2>
                        <div className="flex gap-1 movie-list">
                            {results?.results.filter(r => r.media_type === 'movie' && !r.adult).map((result) => (
                                <div key={result.id} className={`movie-card${result.adult ? ' adult' : ''}`} onClick={() => { goTo(result.id, result.media_type) }}>
                                    <img src={`https://image.tmdb.org/t/p/w342${result.poster_path}`} alt={getNameOrTitle(result)} />
                                    <span>{getNameOrTitle(result)}</span>
                                </div>
                            ))}
                        </div>
                        <h2>TV Shows</h2>
                        <div className="flex gap-1 movie-list">
                            {results?.results.filter(r => r.media_type === 'tv' || r.media_type === 'series' && !r.adult).map((result) => (
                                <div key={result.id} className={`movie-card${result.adult ? ' adult' : ''}`} onClick={() => { goTo(result.id, result.media_type) }}>
                                    <img src={`https://image.tmdb.org/t/p/w342${result.poster_path}`} alt={(result as TVShow).name} />
                                    <span>{(result as TVShow).name}</span>
                                </div>
                            ))}
                        </div>
                        <h2>People</h2>
                        <div className="flex gap-1 movie-list">
                        {results?.results.filter(r => r.media_type === 'person').map((result) => (
                            <div key={(result as Person).id} className={`movie-card${result.adult ? ' adult' : ''}`} onClick={() => { goTo((result as Person).id, (result as Person).media_type) }}>
                                <img src={(result as Person).profile_path == null ? 'https://upload.wikimedia.org/wikipedia/commons/f/fc/No_picture_available.png' : `https://image.tmdb.org/t/p/w342${(result as Person).profile_path}`} alt={(result as Person).name} />
                                <span>{(result as Person).name}</span>
                            </div>
                        ))}
                        </div>
                    </>
                ) : (<></>)
                }
            </div>
        </PageLayout>
    );
}