"use client";
import PageLayout from "@/app/components/PageLayout";
import { TMDBMovie } from "../page";
import { useEffect, useState } from "react";
import { getMovies } from "@/app/components/useTMDB";
import React from "react";
import Head from "next/head";
import sources from "@/app/components/Sources";

interface MovieProps {
    params: Promise<{ id: number }>;
}

export default function MoviePage({ params }: MovieProps) {
    const [movie, setMovie] = useState<TMDBMovie | null>(null);
    const [failed, setFailed] = useState(false);
    const [fullscreen, setFullscreen] = useState(false);

    const [source, setSource] = useState<'2embed' | 'smashy' | 'vidsrc'>('vidsrc');

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

    return (
        <>
            <head>
                <title>{movie ? movie.title : 'Movie'} - Movieslay</title>
                <meta name="description" content={movie ? movie.overview : 'Movie details'} />
                <meta property="og:title" content={movie ? movie.title : 'Movie'} />
                <meta property="og:description" content={movie ? movie.overview : 'Movie details'} />
                <meta property="og:image" content={`https://image.tmdb.org/t/p/w342${movie?.poster_path}`} />
                <meta property="og:url" content={window.location.href} />
                <meta name="twitter:card" content="summary_large_image" />
                <meta name="twitter:title" content={movie ? movie.title : 'Movie'} />
                <meta name="twitter:description" content={movie ? movie.overview : 'Movie details'} />
                <meta name="twitter:image" content={`https://image.tmdb.org/t/p/w342${movie?.poster_path}`} />
            </head>
            <PageLayout title={`${movie ? movie.title : 'Movie'}`}>
                <div className={`flex align flex-col ${fullscreen ? '' : 'gap-05'} movie-page${fullscreen ? ' fullscreen' : ''}`} style={{gap:`${fullscreen ? '0px' : '1rem'}`}}>
                    { failed ? <>
                        <h1>Movie not found.</h1>
                    </> : <>
                        {fullscreen ? (
                            <div style={{display:'flex',alignItems:'flex-end',justifyContent:'right',width:'100%'}}>
                                <button style={{marginTop:'2px'}} className="server thin" onClick={() => {
                                    setFullscreen(false);
                                }}><i className="fa-solid fa-compress"></i> Minimize</button>
                            </div>
                        ) : null}
                        <iframe src={`${sources[source].movie.replace('%id%',`${movie?.id}`)}`}></iframe>
                        <div className="info-card flex align gap-1" style={{backgroundImage:`https://image.tmdb.org/t/p/w780`}}>
                            <img src={`https://image.tmdb.org/t/p/w342${movie?.poster_path}`}/>
                            <div className="flex flex-col details">
                                <b>{movie?.title}</b>
                                <p>{movie?.overview}</p>
                            </div>
                            <div className="flex flex-col gap-05 justify servers">
                                {/* <button className="server" onClick={()=>{
                                    navigator.clipboard.writeText(window.location.href);
                                }}>
                                    <i className="fa-solid fa-clone"></i>
                                    Copy Link
                                </button>
                                <button className="server" onClick={()=>{
                                    window.open(`https://bsky.app/intent/compose?text=Watch%20${encodeURIComponent(movie?.title||'movies like this one')}%20on%20Movieslay:%20${encodeURIComponent(window.location.href)}`);
                                }}>
                                    <i className="fa-solid fa-brands fa-bluesky"></i>
                                    Bluesky
                                </button>
                                <button className="server" onClick={()=>{
                                    window.open(`https://twitter.com/intent/tweet?text=Watch%20${encodeURIComponent(movie?.title||'movies like this one')}%20on%20Movieslay:&url=${encodeURIComponent(window.location.href)}`);
                                }}>
                                    <i className="fa-solid fa-brands fa-twitter"></i>
                                    Tweet
                                </button> */}
                                <button className="server" onClick={()=>{
                                    setFullscreen(!fullscreen);
                                }}><i className="fa-solid fa-expand"></i> Expand</button>
                                <button className={`server ${source=='vidsrc'?'active':''}`} onClick={()=>{
                                    setSource('vidsrc');
                                }}>
                                    <i className="fa-solid fa-server"></i>
                                    VidSrc
                                </button>
                                <button className={`server ${source=='2embed'?'active':''}`} onClick={()=>{
                                    setSource('2embed');
                                }}>
                                    <i className="fa-solid fa-server"></i>
                                    2Embed
                                </button>
                                <button className={`server ${source=='smashy'?'active':''}`} onClick={()=>{
                                    setSource('smashy');
                                }}>
                                    <i className="fa-solid fa-server"></i>
                                    Smashy
                                </button>
                            </div>
                        </div>
                        <p style={{fontSize:'14px',textAlign:'center'}}><i className="fa-solid fa-warning" style={{color:"#ff5050",marginRight:'5px'}}></i>An adblocker is reccomended to deter harmful popups (outside of Movieslay's control)</p>
                    </>}
                </div>
            </PageLayout>
        </>
    );
}