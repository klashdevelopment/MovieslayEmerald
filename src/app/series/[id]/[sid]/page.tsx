"use client";
import PageLayout from "@/app/components/PageLayout";
import { TMDBShow } from "../../page";
import { useEffect, useState } from "react";
import { getMovies, getSeasonData } from "@/app/components/useTMDB";
import React from "react";
import { useRouter } from "next/navigation";
import Head from "next/head";

interface MovieProps {
    params: Promise<{ id: number, sid: number }>;
}

interface TMDBGenre {
    id: number;
    name: string;
}

interface TMDBEpisode {
    id: number;
    name: string;
    overview: string;
    vote_average: number;
    vote_count: number;
    air_date: string;
    episode_number: number;
    episode_type: string;
    production_code: string;
    runtime: number | null;
    season_number: number;
    show_id: number;
    still_path: string | null;
}

interface TMDBNetwork {
    id: number;
    logo_path: string;
    name: string;
    origin_country: string;
}

interface TMDBProductionCompany {
    id: number;
    logo_path: string | null;
    name: string;
    origin_country: string;
}

interface TMDBProductionCountry {
    iso_3166_1: string;
    name: string;
}

interface TMDBSeason {
    air_date: string;
    episode_count: number;
    id: number;
    name: string;
    overview: string;
    poster_path: string | null;
    season_number: number;
    vote_average: number;
}

interface TMDBSpokenLanguage {
    english_name: string;
    iso_639_1: string;
    name: string;
}

interface TMDBShowDetails {
    adult: boolean;
    backdrop_path: string | null;
    created_by: any[]; // Replace 'any' with a specific interface if details are available
    episode_run_time: number[];
    first_air_date: string;
    genres: TMDBGenre[];
    homepage: string;
    id: number;
    in_production: boolean;
    languages: string[];
    last_air_date: string;
    last_episode_to_air: TMDBEpisode | null;
    name: string;
    next_episode_to_air: TMDBEpisode | null;
    networks: TMDBNetwork[];
    number_of_episodes: number;
    number_of_seasons: number;
    origin_country: string[];
    original_language: string;
    original_name: string;
    overview: string;
    popularity: number;
    poster_path: string | null;
    production_companies: TMDBProductionCompany[];
    production_countries: TMDBProductionCountry[];
    seasons: TMDBSeason[];
    spoken_languages: TMDBSpokenLanguage[];
    status: string;
    tagline: string;
    type: string;
    vote_average: number;
    vote_count: number;
}
interface TMDBSeasonDetail {
    _id: string;
    air_date: string;
    episodes: TMDBSeasonEpisode[];
    name: string;
    overview: string;
    id: number;
    poster_path: string;
    season_number: number;
    vote_average: number;
}

interface TMDBSeasonEpisode {
    air_date: string;
    episode_number: number;
    id: number;
    name: string;
    overview: string;
    production_code: string;
    runtime: number;
    season_number: number;
    show_id: number;
    still_path: string;
    vote_average: number;
    vote_count: number;
    crew: TMDBCrewMember[];
    guest_stars: TMDBGuestStar[];
}

interface TMDBCrewMember {
    department: string;
    job: string;
    credit_id: string;
    adult: boolean;
    gender: number;
    id: number;
    known_for_department: string;
    name: string;
    original_name: string;
    popularity: number;
    profile_path: string | null;
}

interface TMDBGuestStar {
    character: string;
    credit_id: string;
    order: number;
    adult: boolean;
    gender: number;
    id: number;
    known_for_department: string;
    name: string;
    original_name: string;
    popularity: number;
    profile_path: string | null;
}


export default function SeriesPage({ params }: MovieProps) {
    const [show, setShow] = useState<TMDBShowDetails | null>(null);
    const [season, setSeason] = useState<TMDBSeasonDetail | null>(null);
    const [failed, setFailed] = useState(false);

    const router = useRouter();

    useEffect(() => {
        params.then(({ id, sid }) => {
            getMovies(id, 'tv').then(data => {
                if (data.success === false) {
                    setFailed(true);
                    return;
                }
                setShow(data);
            });

            if (failed) return;

            getSeasonData(id, sid).then(data => {
                if (data.success === false) {
                    setFailed(true);
                    return;
                }
                setSeason(data);
            });
        });
    }, [params]);
    useEffect(() => {
        if (show && season) {
            const title = `${show.name} (S${season.season_number}) - Movieslay`;
            const description = season.overview || 'Show details';
            const imageUrl = `https://image.tmdb.org/t/p/w342${show.poster_path}`;
            const url = window.location.href;
    
            document.title = title;
    
            const metaTags = [
                { name: "description", content: description },
                { property: "og:title", content: title },
                { property: "og:description", content: description },
                { property: "og:image", content: imageUrl },
                { property: "og:url", content: url },
                { name: "twitter:card", content: "summary_large_image" },
                { name: "twitter:title", content: title },
                { name: "twitter:description", content: description },
                { name: "twitter:image", content: imageUrl },
            ];
    
            metaTags.forEach(({ name, property, content }) => {
                const meta = document.createElement("meta");
                if (name) meta.name = name;
                if (property) meta.setAttribute("property", property);
                meta.content = content;
                document.head.appendChild(meta);
            });
    
            return () => {
                metaTags.forEach(({ name, property }) => {
                    const selector = name ? `meta[name="${name}"]` : `meta[property="${property}"]`;
                    const meta = document.head.querySelector(selector);
                    if (meta) document.head.removeChild(meta);
                });
            };
        }
    }, [show, season]);    

    return (
        <>
            <PageLayout title={`${show ? `${show.name} ${season?.name}` : 'Show'}`}>
                <div className="flex align flex-col gap-05 movie-page">
                    {failed ? <>
                        <h1>Show not found.</h1>
                    </> : <>
                        <div className="info-card selection flex align gap-05 flex-col" style={{ marginTop: '8px', overflowY: 'auto', height: '65%' }}>
                            {season?.episodes.map(episode => (
                                <button key={episode.id} className="server" onClick={()=>{router.push(`/series/${show?.id}/${season.season_number}/${episode.episode_number}`)}} style={{width: '100%'}}>{episode.episode_number}. {episode.name}</button>
                            ))}
                        </div>
                        <div className="info-card flex align gap-1">
                            <img src={`https://image.tmdb.org/t/p/w342${show?.poster_path}`} />
                            <div className="flex flex-col justify details">
                                <b>{show?.name}</b>
                                <span>S{season?.season_number} - {season?.name}</span>
                                <p>{show?.overview}</p>
                                <p>{season?.overview}</p>
                            </div>
                            <div className="flex flex-col gap-05 justify servers">
                                <button className="server" onClick={() => {
                                    navigator.clipboard.writeText(window.location.href);
                                }}>
                                    <i className="fa-solid fa-clone"></i>
                                    Copy
                                </button>
                                <button className="server" onClick={() => {
                                    window.open(`https://bsky.app/intent/compose?text=Watch%20${encodeURIComponent(show?.name || 'show like this one')}%20on%20Movieslay:%20${encodeURIComponent(window.location.href)}`);
                                }}>
                                    <i className="fa-solid fa-brands fa-bluesky"></i>
                                    Bluesky
                                </button>
                                <button className="server" onClick={() => {
                                    window.open(`https://twitter.com/intent/tweet?text=Watch%20${encodeURIComponent(show?.name || 'shows like this one')}%20on%20Movieslay:&url=${encodeURIComponent(window.location.href)}`);
                                }}>
                                    <i className="fa-solid fa-brands fa-twitter"></i>
                                    Tweet
                                </button>
                            </div>
                        </div>
                    </>}
                </div>
            </PageLayout>
        </>
    );
}