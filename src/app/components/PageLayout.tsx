"use client";
import { CssVarsProvider, Sheet } from "@mui/joy";
import Head from "next/head";
import { useRouter } from "next/navigation";
import { useEffect, useState, createContext, useContext } from "react";

const IsDesktopContext = createContext(false);

export function useIsDesktop() {
    return useContext(IsDesktopContext);
}

export default function PageLayout({
    children,
    title="Home",
    hideNav=false
}: Readonly<{
    children: React.ReactNode;
    title?: string;
    hideNav?: boolean;
}>) {
    var router = useRouter();
    const [isDesktop, setIsDesktop] = useState(false);

    useEffect(()=>{
        if(
            (navigator && navigator.userAgent.includes("Movieslay")) ||
            (location.hostname.includes('desktop.movieslay.com'))
        ) {
            setIsDesktop(true);
        }
    }, []);

    function showSearch() {
        router.push('/search');
    }
    return (
        <>
            <CssVarsProvider defaultMode="dark">
                <IsDesktopContext.Provider value={isDesktop}>
                    <Sheet variant={'outlined'} sx={{height: 'calc(100vh - 25px)', width: 'calc(100vw - 25px)', padding: '10px', boxSizing: 'border-box', borderRadius: '12px'}} className={"flex flex-col align" + (isDesktop ? " desktop-app-framed" : "")}>
                        {!(hideNav && isDesktop) && <Sheet sx={{display: 'flex', alignItems: 'center', justifyContent: 'space-evenly', px: '10px', gap: '10px', width: '100%', height: '50px', borderRadius: '12px'}} className={"nav"} variant="outlined">
                            <div className="nav-section hide-on-mobile">
                                <b>Movieslay</b> {title ? `| ${title}` : ""}
                            </div>
                            <div className="nav-section media-options">
                            <a onClick={()=>{router.push("/app")}} className="hide-on-desktop hide-on-desktopapp"><i className="fa-solid fa-grid-2"></i></a>
                                <a onClick={()=>{router.push("/movie")}}><i className="fa-solid fa-camera-movie"></i> Movies</a>
                                <a onClick={()=>{router.push("/series")}}><i className="fa-solid fa-clapperboard"></i>
                                    <span className="hide-on-mobile">Shows</span>
                                    <span className="hide-on-desktop">TV</span>
                                </a>
                                <a onClick={()=>{router.push("/search")}}><i className="fa-solid fa-magnifying-glass"></i> 
                                    <span className="hide-on-mobile">Search</span>
                                    <span className="hide-on-desktop">Find</span>
                                </a>
                                <a onClick={()=>{router.push("/")}} className="hide-on-desktop"><i className="fa-solid fa-home"></i></a>
                                <a onClick={()=>{router.push("/app")}} className="hide-on-mobile hide-on-desktopapp"><i className="fa-solid fa-grid-2"></i> App</a>
                            </div>
                            <div className="nav-section hide-on-mobile mini-options">
                                <a onClick={()=>{router.push("/")}}><i className="fa-solid fa-home"></i></a>
                            </div>
                        </Sheet>}
                        <Sheet sx={{px: `${hideNav ? '0px' : '10px'}`, display: 'flex', flexDirection:'column', width: '100%', height:`${hideNav ? '100%' : 'calc(100% - 60px)'}`, mt: `${hideNav ? '0px' : '10px'}`, borderRadius: '12px', overflowY: 'auto', scrollbarWidth: 'none'}} className={"content"} variant="outlined">
                            {children}
                        </Sheet>
                    </Sheet>
                </IsDesktopContext.Provider>
            </CssVarsProvider>
        </>
    );
}