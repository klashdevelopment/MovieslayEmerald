"use client";
import { Sheet } from "@mui/joy";
import PageLayout from "../components/PageLayout";
import { WavyBackground } from "../components/aceternity/BackgroundWave";
import { useEffect, useState } from "react";
import { getMovies } from "../components/useTMDB";
import { useRouter } from "next/navigation";

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
    const [movies, setMovies] = useState<TMDBMovie[]>([]);
    const [trendingMovies, setTrendingMovies] = useState<TMDBMovie[]>([]);
    const [genres, setGenres] = useState<Genre[]>([]);

    useEffect(() => {
        getMovies(1).then((data) => {
            setMovies(data.results);
        });
        getMovies(1, 'trending-week-movie').then((data) => {
            setTrendingMovies(data.results);
        });
        getMovies(1, 'genres').then((data) => {
            setGenres(data.genres);
        });
    }, []);

    const router = useRouter();

    function goTo(id: string|number, type: string) {
        router.push(`/${type}/${id}`);
    }

    return (
        <PageLayout title="Movies">
            <Sheet variant={'plain'} sx={{height:'30%',overflow:'hidden',marginTop:'8px'}}>
                <WavyBackground style={{width:'100%',height:'100%'}}>
                    <h1 className="relative z-10 text-lg md:text-7xl drop-shadow-[0_4px_4px_rgba(0,0,0,0.8)] bg-clip-text text-transparent bg-gradient-to-b from-[#a7ffeb] to-[#a7ffeb90]  text-center font-sans font-bold">
                        People
                    </h1>
                </WavyBackground>
            </Sheet>
            <div className="full-w" style={{height:'20px'}}></div>
            <div className="flex-align-flex-col list-list">
                <p>There's no list here yet - but you can search for people by clicking the "Search" button at the top.</p>
            </div>
        </PageLayout>
    );
}