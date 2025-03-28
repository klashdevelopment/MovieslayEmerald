"use client";
import PageLayout from "@/app/components/PageLayout";
import { useEffect, useState } from "react";
import { getMovies, getSeasonData } from "@/app/components/useTMDB";
import React from "react";
import { useRouter } from "next/navigation";

interface MovieProps {
    params: Promise<{ id: number }>;
}

interface TMDBPerson {
    adult?: boolean; // Defaults to true
    also_known_as?: string[];
    biography?: string;
    birthday?: string;
    deathday?: string;
    gender?: number; // Defaults to 0
    homepage?: string;
    id?: number; // Defaults to 0
    imdb_id?: string;
    known_for_department?: string;
    name?: string;
    place_of_birth?: string;
    popularity?: number; // Defaults to 0
    profile_path?: string;
}
interface TMDBPersonCreditMedia {
    adult?: boolean; // Defaults to true
    backdrop_path?: string;
    genre_ids?: number[];
    id?: number; // Defaults to 0
    original_language?: string;
    original_title?: string;
    overview?: string;
    popularity?: number; // Defaults to 0
    poster_path?: string;
    release_date?: string;
    title?: string;
    video?: boolean; // Defaults to true
    vote_average?: number; // Defaults to 0
    vote_count?: number; // Defaults to 0
    character?: string;
    credit_id?: string;
    order?: number; // Defaults to 0
    media_type?: string;
}

export default function SeriesPage({ params }: MovieProps) {
    const [person, setPerson] = useState<TMDBPerson | null>(null);
    const [cast, setCast] = useState<TMDBPersonCreditMedia[]>([]);
    const [crew, setCrew] = useState<TMDBPersonCreditMedia[]>([]);
    const [failed, setFailed] = useState(false);

    const router = useRouter();

    useEffect(() => {
        params.then(({ id }) => {
            getMovies(id, 'person').then(data => {
                if (data.success === false) {
                    setFailed(true);
                    return;
                }
                setPerson(data);
            });
            if (failed) return;
            getMovies(id, 'person-credits').then(data => {
                if (data.success === false) {
                    setFailed(true);
                    return;
                }
                setCast(data.cast);
                setCrew(data.crew);
            });
        });
    }, [params]);
    useEffect(() => {
        if (person) {
            const title = `${person.name} - Movieslay`;
            const description = person.biography || 'Show details';
            const imageUrl = person.profile_path ? `https://image.tmdb.org/t/p/w780${person.profile_path}` : 'https://upload.wikimedia.org/wikipedia/commons/f/fc/No_picture_available.png';
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
    }, [person]);    

    return (
        <PageLayout title={`${person ? `${person.name}` : 'Person'}`}>
            <div className="flex align flex-col gap-05" style={{ overflowY: 'auto', flexShrink: '0' }}>
                {failed ? <>
                    <h1>Person not found.</h1>
                </> : <>
                    <div className="info-card flex flex-col gap-1" style={{ marginTop: '20px', marginBottom: '20px', height: '240px' }}>
                        <div style={{ height: '200px' }} className="flex gap-1">
                            <img src={person?.profile_path == null ? 'https://upload.wikimedia.org/wikipedia/commons/f/fc/No_picture_available.png' : `https://image.tmdb.org/t/p/w780${person?.profile_path}`} alt={person?.name} style={{ height: '200px' }} />
                            <div className="flex align justify flex-col gap-05" style={{ height: '200px' }}>
                                <b>{person?.name}</b>
                                <p>{person?.biography}</p>
                            </div>
                        </div>
                    </div>
                    <b>Cast:</b>
                    <div className="flex gap-1 movie-list">
                        {cast.map((movie) => (
                            <div key={movie.id} className={`movie-card${movie.adult ? ' adult' : ''}`} onClick={() => { router.push(`/${movie.media_type?.replaceAll('tv', 'series')}/${movie.id}`) }}>
                                <img src={`https://image.tmdb.org/t/p/w342${movie.poster_path}`} alt={movie.title} />
                                <span>{movie.title}</span>
                            </div>
                        ))}
                    </div>
                    <div className="full-w" style={{ height: '20px' }}></div>
                    <b>Crew:</b>
                    <div className="flex gap-1 movie-list">
                        {crew.map((show) => (
                            <div key={show.id} className={`movie-card${show.adult ? ' adult' : ''}`} onClick={() => { router.push(`/${show.media_type?.replaceAll('tv', 'series')}/${show.id}`) }}>
                                <img src={`https://image.tmdb.org/t/p/w342${show.poster_path}`} alt={show.title} />
                                <span>{show.title}</span>
                            </div>
                        ))}
                    </div>
                </>}
            </div>
        </PageLayout>
    );
}