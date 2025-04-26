"use client";
import Controls from "@/app/components/controls";
import { Exclusive } from "@/app/components/Exclusives";
import PageLayout, { useIsDesktop } from "@/app/components/PageLayout";
import useRecentlyWatched from "@/app/data/RecentlyWatched";
import { useEffect, useState } from "react";

export default function DEPage({movie}: {movie: Exclusive}) {
    const [fullscreen, setFullscreen] = useState(false);
    const isDesktop = useIsDesktop();
    const rw = useRecentlyWatched();
    useEffect(() => {
        if (movie) {
            setTimeout(() => {
                rw.addMedia({
                    type: 'exclusive',
                    title: movie.title,
                    thumbnail: `${movie.image}`,
                    id: `${movie.id}`,
                    series: undefined
                });
            }, 10000);
        }
    }, [movie]);

    return (
        <>
            <PageLayout title={`${movie ? movie.title : 'Movie'}`}>
                <div className={`flex align flex-col ${fullscreen ? '' : 'gap-05'} movie-page${fullscreen ? ' fullscreen' : ''}`} style={{ gap: `${fullscreen ? '0px' : '1rem'}` }}>
                    {<>
                        {fullscreen ? (
                            <button className="server thin mnm-btn" onClick={() => {
                                setFullscreen(false);
                            }}><i className="fa-solid fa-compress"></i></button>
                        ) : null}
                        <iframe src={`/exclusives/designing-empires/internal`} allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" referrerPolicy="strict-origin-when-cross-origin" allowFullScreen></iframe>
                        <div className="info-card flex align gap-1">
                            <img src={`${movie.image}`} />
                            <div className="flex flex-col justify details">
                                <b>{movie?.title}</b>
                                <p>{movie?.description}</p>
                            </div>
                            <div className="flex flex-col gap-05 justify servers">
                                <Controls
                                    fullscreen={fullscreen}
                                    setFullscreen={setFullscreen}
                                    source={null}
                                    setSource={null}
                                    isMovie={true}
                                />
                            </div>
                        </div>
                    </>}
                </div>
            </PageLayout>
        </>
    );
}