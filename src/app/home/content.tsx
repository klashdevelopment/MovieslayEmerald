"use client";

import { useIsDesktop } from "../components/PageLayout";

export default function Homecontent() {
    const isDesktop = useIsDesktop();

    return <>
        { !isDesktop ? <h1 className="relative z-10 text-lg md:text-7xl  bg-clip-text text-transparent bg-gradient-to-b from-blue-100 to-indigo-500  text-center font-sans font-bold">
            Movieslay Emerald
        </h1>
        : <h1 className="relative z-10 text-lg md:text-7xl  bg-clip-text text-transparent bg-gradient-to-b from-blue-100 to-cyan-500  text-center font-sans font-bold">
            Movieslay Emerald <br /> for Desktop
        </h1> }
        <p className="text-light-blue-50 max-w-lg mx-auto my-2 text-sm text-center relative z-10">
            {isDesktop ? `
                Movieslay Emerald for Desktop is a fresh experience for the free and robust streaming service Movieslay. With Movieslay Emerald Desktop, you can watch movies, shows, and anime with ease without needing an adblocker or third party always-on-top programs.
            ` : "Welcome to Movieslay Emerald, the best place to find movies, shows, and anime. Movieslay Emerald is the successor to Movieslay, a free and robust movie streaming service."}
        </p>
    </>;
}