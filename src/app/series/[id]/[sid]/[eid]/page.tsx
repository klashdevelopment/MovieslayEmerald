"use client";
import PageLayout, { useIsDesktop } from "../../../../components/PageLayout";
import { TMDBShow } from "../../../page";
import { useEffect, useState } from "react";
import { getMovies, getSeasonData } from "../../../../components/useTMDB";
import React from "react";
import { useRouter } from "next/navigation";
import sources from "@/app/components/Sources";
import Head from "next/head";

interface MovieProps {
    params: Promise<{ id: number, sid: number, eid: number }>;
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
    const [epid, setEpid] = useState(0);

    const [fullscreen, setFullscreen] = useState(false);
    const isDesktop = useIsDesktop();

    const router = useRouter();

    useEffect(() => {
        params.then(({ id, sid, eid }) => {
            setEpid(eid);
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

    const [source, setSource] = useState<'2embed' | 'smashy' | 'vidsrc'>('vidsrc');

    return (
        <>
            <head>
                <title>{show ? `${show.name} S${season?.season_number}E${epid}` : 'Show'} - Movieslay</title>
                <meta name="description" content={season?.episodes[epid - 1].overview || 'Show details'} />
                <meta property="og:title" content={show ? `${show.name} S${season?.season_number}E${epid}` : 'Show'} />
                <meta property="og:description" content={season?.episodes[epid - 1].overview || 'Show details'} />
                <meta property="og:image" content={`https://image.tmdb.org/t/p/w342${show?.poster_path}`} />
                <meta property="og:url" content={window.location.href} />
                <meta name="twitter:card" content="summary_large_image" />
                <meta name="twitter:title" content={show ? `${show.name} S${season?.season_number}E${epid}` : 'Show'} />
                <meta name="twitter:description" content={season?.episodes[epid - 1].overview || 'Show details'} />
                <meta name="twitter:image" content={`https://image.tmdb.org/t/p/w342${show?.poster_path}`} />
            </head>
            <PageLayout title={`${show ? `${show.name} S${season?.season_number}E${epid}` : 'Show'}`}>
                <div className={`flex align flex-col ${fullscreen ? '' : 'gap-05'} movie-page${fullscreen ? ' fullscreen' : ''}`} style={{gap:`${fullscreen ? '0px' : '1rem'}`}}>
                    {failed ? <>
                        <h1>Show not found.</h1>
                    </> : <>
                        {fullscreen ? (
                            <button style={{}} className="server thin" onClick={() => {
                                setFullscreen(false);
                            }}><i className="fa-solid fa-compress"></i> Minimize</button>
                        ) : null}
                        <iframe src={`${sources[source].series.replace('%id%',`${show?.id}`).replace('%sid%',`${season?.season_number}`).replace('%eid%',`${epid}`)}`} style={{marginTop:`${fullscreen ? '2px' : undefined}`}}></iframe>
                        <div className={`info-card flex align gap-1`}>
                            <img src={`https://image.tmdb.org/t/p/w342${show?.poster_path}`} />
                            <div className="flex flex-col justify details">
                                <b>{show?.name} - S{season?.season_number}E{epid}: {season?.episodes[epid-1].name}</b>
                                <p>{season?.episodes[epid-1].overview}</p>
                            </div>
                            <div className="flex flex-col gap-05 justify servers">
                                {/* <button className="server" onClick={() => {
                                    navigator.clipboard.writeText(window.location.href);
                                }}>
                                    <i className="fa-solid fa-clone"></i>
                                    Copy Link
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
                                </button> */}
                                <button className="server" onClick={()=>{
                                    setFullscreen(!fullscreen);
                                }}><i className="fa-solid fa-expand"></i> Expand</button>
                                <button className="server" onClick={()=>{
                                    setSource('vidsrc');
                                }}>
                                    <i className="fa-solid fa-server"></i>
                                    VidSrc
                                </button>
                                <button className="server" onClick={()=>{
                                    setSource('2embed');
                                }}>
                                    <i className="fa-solid fa-server"></i>
                                    2Embed
                                </button>
                                <button className="server" onClick={()=>{
                                    setSource('smashy');
                                }}>
                                    <i className="fa-solid fa-server"></i>
                                    Smashy
                                </button>
                            </div>
                        </div>
                        { !isDesktop ? <p style={{fontSize:'14px',textAlign:'center'}}><i className="fa-solid fa-warning" style={{color:"#ff5050",marginRight:'5px'}}></i>An adblocker is reccomended to deter harmful popups (outside of Movieslay's control)</p> : "" }
                    </>}
                </div>
            </PageLayout>
        </>
    );
}