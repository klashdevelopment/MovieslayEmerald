"use client";
import PageLayout, { useIsDesktop } from "@/app/components/PageLayout";
import { TMDBMovie } from "../page";
import { useEffect, useState } from "react";
import { getMovies } from "@/app/components/useTMDB";
import React from "react";
import Head from "next/head";
import sources from "@/app/components/Sources";
import Controls from "@/app/components/controls";
import useRecentlyWatched from "@/app/data/RecentlyWatched";

interface MovieProps {
    params: Promise<{ id: number }>;
}

export default function MoviePage({ params }: MovieProps) {
    const [movie, setMovie] = useState<TMDBMovie | null>(null);
    const [failed, setFailed] = useState(false);
    const [fullscreen, setFullscreen] = useState(false);
    const isDesktop = useIsDesktop();

    const [source, setSource] = useState<'2embed' | 'smashy' | 'vidsrc' | 'vsrc2'>('vidsrc');

    useEffect(() => {
        params.then(({ id }) => {
            getMovies(id, 'movie').then(data => {
                if (data.success === false) {
                    setFailed(true);
                    return;
                }
                setMovie(data);
            });
        });
    }, [params]);
    const rw = useRecentlyWatched();
    useEffect(() => {
        if (movie) {
            setTimeout(() => {
                rw.addMedia({
                    type: 'movie',
                    title: movie.title,
                    thumbnail: `https://image.tmdb.org/t/p/w342${movie.poster_path}`,
                    id: `${movie.id}`,
                    series: undefined
                });
            }, 10000);
            const title = `${movie.title} - Movieslay`;
            const description = movie.overview || 'Movie details';
            const imageUrl = `https://image.tmdb.org/t/p/w342${movie.poster_path}`;
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
    }, [movie]);

    return (
        <>
            <PageLayout title={`${movie ? movie.title : 'Movie'}`}>
                <div className={`flex align flex-col ${fullscreen ? '' : 'gap-05'} movie-page${fullscreen ? ' fullscreen' : ''}`} style={{ gap: `${fullscreen ? '0px' : '1rem'}` }}>
                    {failed ? <>
                        <h1>Movie not found.</h1>
                    </> : <>
                        {fullscreen ? (
                            <button className="server thin mnm-btn" onClick={() => {
                                setFullscreen(false);
                            }}><i className="fa-solid fa-compress"></i></button>
                        ) : null}
                        <iframe allowFullScreen rel="noopener noreferrer" src={`${sources[source].movie.replace('%id%', `${movie?.id}`)}`}></iframe>
                        <div className="info-card flex align gap-1">
                            <img src={`https://image.tmdb.org/t/p/w342${movie?.poster_path}`} />
                            <div className="flex flex-col justify details">
                                <b>{movie?.title}</b>
                                <p>{movie?.overview}</p>
                            </div>
                            <div className="flex flex-col gap-05 justify servers">
                                <Controls
                                    fullscreen={fullscreen}
                                    setFullscreen={setFullscreen}
                                    source={source}
                                    setSource={setSource}
                                    isMovie={true}
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