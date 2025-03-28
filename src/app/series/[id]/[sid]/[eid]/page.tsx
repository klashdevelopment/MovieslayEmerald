"use client";
import PageLayout, { useIsDesktop } from "../../../../components/PageLayout";
import { TMDBShow } from "../../../page";
import { useEffect, useState } from "react";
import { getMovies, getSeasonData } from "../../../../components/useTMDB";
import React from "react";
import { useRouter } from "next/navigation";
import sources from "@/app/components/Sources";
import Head from "next/head";
import Controls from "@/app/components/controls";

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
    useEffect(() => {
        if (show && season && epid) {
            const title = `${show.name} S${season.season_number}E${epid} - Movieslay`;
            const description = season.episodes[epid - 1]?.overview || 'Show details';
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
    }, [show, season, epid]);

    function nextEpisode() {
        if (show && season) {
            if (epid < season.episodes.length) {
                router.push(`/series/${show.id}/${season.season_number}/${parseInt(`${epid}`) + 1}`);
            } else {
                router.push(`/series/${show.id}/${season.season_number + 1}/1`);
            }
        }
    }
    function lastEpisode() {
        if (show && season) {
            if (epid > 1) {
                router.push(`/series/${show.id}/${season.season_number}/${parseInt(`${epid}`) - 1}`);
            } else {
                router.push(`/series/${show.id}/${season.season_number - 1}/${season.episodes.length}`);
            }
        }
    }

    return (
        <>
            <PageLayout title={`${show ? `${show.name} S${season?.season_number}E${epid}` : 'Show'}`}>
                <div className={`flex align flex-col ${fullscreen ? '' : 'gap-05'} movie-page${fullscreen ? ' fullscreen' : ''}`} style={{ gap: `${fullscreen ? '0px' : '1rem'}` }}>
                    {failed ? <>
                        <h1>Show not found.</h1>
                    </> : <>
                        {fullscreen ? (
                            <button className="server thin mnm-btn" onClick={() => {
                                setFullscreen(false);
                            }}><i className="fa-solid fa-compress"></i></button>
                        ) : null}
                        <iframe src={`${sources[source].series.replace('%id%', `${show?.id}`).replace('%sid%', `${season?.season_number}`).replace('%eid%', `${epid}`)}`} style={{ marginTop: `${fullscreen ? '2px' : undefined}` }}></iframe>
                        <div className={`info-card flex align gap-1`}>
                            <img src={`https://image.tmdb.org/t/p/w342${show?.poster_path}`} />
                            <div className="flex flex-col justify details">
                                <b>{show?.name} - S{season?.season_number}E{epid}: {season?.episodes[epid - 1].name}</b>
                                <p>{season?.episodes[epid - 1].overview}</p>
                            </div>
                            <div className="flex flex-col gap-05 justify servers">
                                <Controls
                                    fullscreen={fullscreen}
                                    setFullscreen={setFullscreen}
                                    source={source}
                                    setSource={setSource}
                                    isMovie={false}
                                    nextEpisode={nextEpisode}
                                    lastEpisode={lastEpisode}
                                />
                            </div>
                        </div>
                        {!isDesktop ? <p className="hide-on-desktopapp hide-on-fullscreen" style={{ fontSize: '14px', textAlign: 'center' }}><i className="fa-solid fa-warning" style={{ color: "#ff5050", marginRight: '5px' }}></i>An adblocker is reccomended to deter harmful popups (outside of Movieslay's control)</p> : ""}
                    </>}
                </div>
            </PageLayout>
        </>
    );
}