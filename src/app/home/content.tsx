"use client";

import { useState } from "react";
import { useIsDesktop } from "../components/PageLayout";
import { useRouter } from "next/navigation";
import useRecentlyWatched, { RecentMedia } from "../data/RecentlyWatched";

export default function Homecontent() {
    const isDesktop = useIsDesktop();
    const rw = useRecentlyWatched();

    const router = useRouter();

    function goToMedia(media: RecentMedia) {
        if (media.type === 'movie') {
            var href = `/movie/${media.id}`;
            router.push(href);
        } else if (media.type === 'series') {
            var href = `/series/${media.id}${media.series ? `/${media.series.season}/${media.series.episode}` : ''}`;
            router.push(href);
        } else if (media.type === 'exclusive') {
            var href = `/exclusives/${media.id}`;
            router.push(href);
        }
    }

    return <>
        <div style={{ height: '80%', width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column' }}>
            {!isDesktop ? <h1 className="relative z-10 text-lg md:text-7xl  bg-clip-text text-transparent bg-gradient-to-b from-blue-100 to-indigo-500  text-center font-sans font-bold">
                Movieslay Emerald
            </h1>
                : <h1 className="relative z-10 text-lg md:text-7xl  bg-clip-text text-transparent bg-gradient-to-b from-blue-100 to-cyan-500  text-center font-sans font-bold">
                    Movieslay Emerald <br /> for Desktop
                </h1>}
            <p className="text-light-blue-50 max-w-lg mx-auto my-2 text-sm text-center relative z-10">
                {isDesktop ? `
                    Movieslay Emerald for Desktop is a fresh experience for the free and robust streaming service Movieslay. With Movieslay Emerald Desktop, you can watch movies, shows, and anime with ease without needing an adblocker or third party always-on-top programs.
                ` : "Welcome to Movieslay Emerald, the best place to find movies, shows, and anime. Movieslay Emerald is the successor to Movieslay, a free and robust movie streaming service."}
            </p>
        </div>
        <div style={{ width: 'calc(100% - 20px)' }} className={'z-[30]'}>
            {rw.recentlyWatched.length > 0 && <>
                <b>Recently Watched</b>
                <div className="flex gap-1 movie-list">
                    {rw.recentlyWatched.map((media, index) => (
                        <div key={index} className="movie-card relative" onClick={() => goToMedia(media)}>
                            {media.type === 'series' && <><div className="movie-card-overlay z-[31]">
                                <b>S{media.series?.season}</b>
                                <b>E{media.series?.episode}</b>
                            </div></>}
                            <img src={media.thumbnail} alt={media.title} loading={"lazy"} />
                            <span>{media.title}</span>
                        </div>
                    ))}
                </div>
            </>}
        </div>
    </>;
}