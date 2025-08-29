"use client";
import { Sheet } from "@mui/joy";
import PageLayout from "../components/PageLayout";
import { WavyBackground } from "../components/aceternity/BackgroundWave";
import { useEffect, useState } from "react";
import { getMovies } from "../components/useTMDB";
import { useRouter } from "next/navigation";
import { Genre } from "../movie/page";
import exclusives from "../components/Exclusives";
import { sports } from "../sports/Sports";

export interface TMDBShow {
    id: number;
    name: string;
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

export default function MovieIndex() {
    const [movies, setMovies] = useState<TMDBShow[]>([]);
    const [trendingShows, setTrendingShows] = useState<TMDBShow[]>([]);
    const [genres, setGenres] = useState<Genre[]>([]);

    useEffect(() => {
        getMovies(1, 'discover-tv').then((data) => {
            setMovies(data.results);
            console.log(data);
        });
        getMovies(1, 'trending-week-tv').then((data) => {
            setTrendingShows(data.results);
        });
        getMovies(1, 'genres-tv').then((data) => {
            setGenres(data.genres);
        });
    }, []);

    const router = useRouter();

    function goTo(id: string | number, type: string) {
        router.push(`/${type.replaceAll('tv', 'series')}/${id}`);
    }

    return (
        <PageLayout title="Shows">
            <Sheet variant={'plain'} sx={{ height: '30%', overflow: 'hidden', marginTop: '8px' }}>
                <WavyBackground style={{ width: '100%', height: '100%' }} colors={[
                    "#f87171", // Replacing #38bdf8
                    "#fb923c", // Replacing #818cf8
                    "#facc15", // Replacing #c084fc
                    "#f97316", // Replacing #e879f9
                    "#f43f5e"  // Replacing #22d3ee
                ]}>
                    <h1 className="relative z-10 text-lg md:text-7xl drop-shadow-[0_4px_4px_rgba(0,0,0,0.8)] bg-clip-text text-transparent bg-gradient-to-b from-[#ffb997] to-[#ffb99790]  text-center font-sans font-bold">
                        Shows
                    </h1>
                </WavyBackground>
            </Sheet>
            <div className="full-w" style={{ height: '20px' }}></div>
            <div className="flex-align-flex-col list-list">
                <b>Now Playing Shows</b>
                <div className="flex gap-1 movie-list">
                    {movies.map((movie) => (
                        <div key={movie.id} className={`movie-card${movie.adult ? ' adult' : ''}`} onClick={() => { goTo(movie.id, 'series') }}>
                            <img src={`https://image.tmdb.org/t/p/w342${movie.poster_path}`} alt={movie.name} />
                            <span>{movie.name}</span>
                        </div>
                    ))}
                </div>
                <div className="full-w" style={{ height: '20px' }}></div>
                <b>Trending Shows</b>
                <div className="flex gap-1 movie-list">
                    {trendingShows.map((movie) => (
                        <div key={movie.id} className={`movie-card${movie.adult ? ' adult' : ''}`} onClick={() => { goTo(movie.id, 'series') }}>
                            <img src={`https://image.tmdb.org/t/p/w342${movie.poster_path}`} alt={movie.name} />
                            <span>{movie.name}</span>
                        </div>
                    ))}
                </div>
                <div className="full-w" style={{ height: '20px' }}></div>
                <b>Live Sports</b>
                <div className="flex gap-1 movie-list">
                    {sports.map((sport) => (
                        <div key={sport.id} className={`movie-card`} onClick={() => { goTo(sport.id, 'sports/matches') }}>
                            <img src={`/sport/${sport.id}.webp`} alt={sport.name} />
                            <span>{sport.name}</span>
                        </div>
                    ))}
                </div>
                <div className="full-w" style={{ height: '20px' }}></div>
                <b>Our Favourites</b>
                <div className="flex gap-1 movie-list">
                    {exclusives.map((movie) => (
                        <div key={movie.id} className={`movie-card`} onClick={() => { goTo(movie.link, 'exclusives') }}>
                            <img src={`${movie.image}`} alt={movie.title} />
                            <span>{movie.title}</span>
                        </div>
                    ))}
                </div>
                <div className="full-w" style={{ height: '20px' }}></div>
                <b>All Genres</b>
                <div className="flex gap-1 movie-list">
                    {genres.map((genre) => (
                        <div key={genre.id} className={`movie-card`}>
                            <img src={`/genres/${genre.name.split(' & ')[0]}.webp`} alt={genre.name} loading={"lazy"} />
                            <span>{genre.name}</span>
                        </div>
                    ))}
                </div>
            </div>
        </PageLayout>
    );
}