"use client";
import PageLayout, { useIsDesktop } from "../../../components/PageLayout";
import { useEffect, useState } from "react";
import React from "react";
import { useRouter } from "next/navigation";
import sources from "@/app/components/Sources";
import Head from "next/head";
import Controls from "@/app/components/controls";
import useRecentlyWatched from "@/app/data/RecentlyWatched";
import { sports } from "../../Sports";

interface MovieProps {
    params: Promise<{ id: string, sport: string }>;
}

interface SportSource {
    source: 'alpha' | 'bravo' | 'charlie' | 'delta' | 'echo' | 'foxtrot';
    id: string;
}
interface SportSourceData {id: string, streamNo: number, language: string, hd: boolean, embedUrl: string, source: 'alpha' | 'bravo' | 'charlie' | 'delta' | 'echo' | 'foxtrot'}

export default function SeriesPage({ params }: MovieProps) {
    const [sport, setSport] = useState<any | null>(null);
    const [sportName, setSportName] = useState<string>('other');
    const [matches, setMatches] = useState<any[]>([]);

    useEffect(() => {
        params.then(({id, sport: sporty}) => {
            setSportName(sporty);
            const sportz = sportFromId(sporty);
            if (sportz) {
                fetch(`https://streamed.pk/api/matches/${sportz.id}`)
                    .then((res) => res.json())
                    .then((data) => {
                        setMatches(data);
                        var foundSport = data.filter((match: any) => match.id === id)[0];
                        if (foundSport) {
                            setSport(foundSport);
                            foundSport.sources.forEach((source: SportSource) => {
                                getSourceDatas(source).then((data) => {
                                    if(data) {
                                        if(!selectedSource) {
                                            setSelectedSource(data[0]);
                                        }
                                        setSourceDatas((prev) => {
                                            if (prev) {
                                                return [...prev, ...data];
                                            } else {
                                                return data;
                                            }
                                        });
                                    }
                                });
                            });
                        } else {
                            console.error("Sport match not found");
                        }
                    });
            } else {
                console.error("Sport not found");
            }
        });
    }, [params]);

    const [fullscreen, setFullscreen] = useState(false);
    const isDesktop = useIsDesktop();

    const [selectedSource, setSelectedSource] = useState<SportSourceData|null>(null);
    const [sourceDatas, setSourceDatas] = useState<SportSourceData[]|null>(null);
    const [selectedSourceIndex, setSelectedSourceIndex] = useState<number>(0);

    async function getSourceDatas(source: SportSource): Promise<SportSourceData[] | null> {
        if (!source) return null;
        const res = await fetch(`https://streamed.pk/api/stream/${source.source}/${source.id}`);
        const data = await res.json();
        if (data && data.length > 0) {
            return data;
        } else {
            return null;
        }
    }

    const router = useRouter();
    const rw = useRecentlyWatched();
    function sportFromId(id: string) {
        const ss = sports.find((sss) => sss.id === id);
        return ss || null;
    }
    function formatPoster(poster: string) {
        if(!poster||poster == undefined||poster==null||poster.length<1) return `/sport/${sportName||'other'}.webp`;
        if(poster.startsWith('/')) {
            return `https://streamed.pk${poster}`;
        } else {
            return poster;
        }
    }
    useEffect(() => {
        if (sport) {
            // setTimeout(() => {
            //     rw.addMedia({
            //         type: 'sports',
            //         title: sport.name,
            //         thumbnail: formatPoster(sport.poster),
            //         id: sport.id
            //     });
            // }, 10000);
            const title = `${sport?.title} - Movieslay`;
            const description = 'Show details';
            const imageUrl = sport.poster;
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
    }, [sport]);

    return (
        <>
            <PageLayout title={`${sport ? `${sport?.title}` : 'Sport'}`} hideNav={fullscreen}>
                <div className={`flex align flex-col ${fullscreen ? '' : 'gap-05'} movie-page${fullscreen ? ' fullscreen' : ''}`} style={{ gap: `${fullscreen ? '0px' : '1rem'}` }}>
                    {false ? <>
                        <h1>Show not found.</h1>
                    </> : <>
                        {fullscreen ? (
                            <button className="server thin mnm-btn" onClick={() => {
                                setFullscreen(false);
                            }}><i className="fa-solid fa-compress"></i></button>
                        ) : null}
                        <iframe allowFullScreen rel="noopener noreferrer" src={`${selectedSource?.embedUrl||formatPoster(sport?.poster)}`} style={{ marginTop: `${fullscreen ? '2px' : undefined}` }}></iframe>
                        <div className={`info-card flex align gap-1`}>
                            <img src={formatPoster(sport?.poster)} />
                            <div className="flex flex-col justify details">
                                <b>{sport?.title}</b>
                            </div>
                            <div className="flex flex-col gap-05 justify servers">
                                <Controls
                                    fullscreen={fullscreen}
                                    setFullscreen={setFullscreen}
                                    isMovie={true}
                                    customServerNumber={`${selectedSource?.language} ${selectedSource?.hd ? 'HD' : 'SD'} ${selectedSource?.streamNo}`}
                                    onCustomServerChange={(delta) => {
                                        if (sourceDatas && sourceDatas.length > 0) {
                                            let newIndex = selectedSourceIndex + delta;
                                            if (newIndex < 0) {
                                                newIndex = sourceDatas.length - 1;
                                            } else if (newIndex >= sourceDatas.length) {
                                                newIndex = 0;
                                            }
                                            setSelectedSource(sourceDatas[newIndex]);
                                            setSelectedSourceIndex(newIndex);
                                        }
                                    }}
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