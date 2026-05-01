"use client";

import { getMovies } from "@/app/components/useTMDB";
import { TMDBMovie } from "@/app/movie/page";
import { TMDBShow } from "@/app/series/page";
import { FebboxAPI, FebboxReply } from "@/app/utils/FebboxAPI";
import { useEffect, useRef, useState } from "react";
import Hls from "hls.js";
import { VidrockAPI } from "@/app/utils/VidrockAPI";

interface MovieProps {
    params: Promise<{ data: string }>;
}

interface PlayerData {
    id: string;
    type: "movie" | "series";
    season?: number;
    episode?: number;
}

type FinalData = {
    from: "febbox" | "anyembed" | "vidrock";
    data: FebboxReply | any; // AnyEmbed is still in heavy beta, so we'll implement it as needed in the future lol
};

export default function PlayerPage({ params }: MovieProps) {
    const [playerData, setPlayerData] = useState<PlayerData | null>(null);
    const [error, setError] = useState<string | null>(null);

    const [tmdbData, setTmdbData] = useState<TMDBMovie | TMDBShow | null>(null);

    const [finalData, setFinalData] = useState<FinalData | null>(null);

    const [currentStream, setCurrentStream] = useState<{ type: string; url: string } | null>(null);

    async function fetchContent() {
        let stream = null;
        let data: FinalData | null = null;
        // 1. febbox
        let febbox;
        const name = (playerData?.type === "movie" ? (tmdbData as TMDBMovie)?.title : (tmdbData as TMDBShow)?.name) || "";
        const year = playerData?.type === "movie" ? (tmdbData as TMDBMovie)?.release_date?.split("-")[0] : (tmdbData as TMDBShow)?.release_date?.split("-")[0];

        try {
            febbox = await FebboxAPI.search(
                name,
                year,
                playerData?.season,
                playerData?.episode
            );
            data = ({ from: "febbox", data: febbox });
            stream = (febbox.streams['1080P'] || febbox.streams['720P'] || febbox.streams['360P'] || febbox.streams[Object.keys(febbox.streams)[0]]); // Try 1080P, then 720P, then 360P, then whatever the first one is
        } catch (err) {
            console.error("Failed to fetch from Febbox:", err);
        }

        // 2. anyembed (if febbox fails)
        let ae;
        if (!stream) {
            try {
                // AE is down as im developing this
            } catch (err) {
                console.error("Failed to fetch from AnyEmbed:", err);
            }
        }

        let vidrock: any;
        if (!stream) {
            try {
                const r = await VidrockAPI.search(playerData!.id, playerData!.type === "movie" ? "movie" : "tv", playerData!.season?.toString() || "1", playerData!.episode?.toString() || "1");
                if (r) {
                    vidrock = r;
                    data = ({ from: "vidrock", data: vidrock });
                    /* Example: {"hls":[{"type":"hls","url":"https://storrrrrrm.site/stream/14ca22547a6db1ee/master.m3u8"},{"type":"hls","url":"https://hellstorm.lol/file1/937e8b49baabbf15efdaf2f0620f8100f4284e058a4b786caff3aef9f9b6a60d/master.m3u8"}],"mp4":{"360":{"type":"mp4","url":"https://dreadnought.scp098.workers.dev/https%3A%2F%2Fbcdnxw.hakunaymatata.com%2Fconvert-h264%2F9f2a2b5f481c4c7c92df662dbf711443.mp4%3Fsign%3D64ff7b5ecfb700d05ef4b47fdb7b73c4%26t%3D1777565647"},"480":{"type":"mp4","url":"https://dreadnought.scp098.workers.dev/https%3A%2F%2Fbcdnxw.hakunaymatata.com%2Fconvert-h264%2Fa5f087b5b7e564ab12736bb1a7df1b72.mp4%3Fsign%3D93f7f0ba218a34b54e6d660b8c2df9ca%26t%3D1777566669"},"1080":{"type":"mp4","url":"https://dreadnought.scp098.workers.dev/https%3A%2F%2Fbcdnxw.hakunaymatata.com%2Fconvert-h264%2F8aa05bb22e0940adc12245783ca69e92.mp4%3Fsign%3D1d95094f596f9f8e95b364e98a7db76d%26t%3D1777567327"}}} */
                    // filter url = storrrrrrm.site
                    vidrock.hls = vidrock.hls.filter((s: any) => s.url.includes("storrrrrrm.site"));
                    if (vidrock.hls && vidrock.hls.length > 0) {
                        stream = ({ type: "hls", url: vidrock.hls[0].url }); // just take the first hls source if no mp4s are available
                    } else if (vidrock.mp4) {
                        const resolutions = Object.keys(vidrock.mp4).map(r => parseInt(r)).sort((a, b) => b - a); // sort descending
                        for (const res of resolutions) {
                            if (vidrock.mp4[res]?.url) {
                                stream = ({ type: "mp4", url: vidrock.mp4[res].url });
                                break;
                            }
                        }
                    }
                }
            } catch (err) {
                console.error("Failed to fetch from Vidrock:", err);
            }
        }

        if (!febbox && !ae && !vidrock && !stream) {
            setError("Failed to fetch media from all sources");
        }

        setCurrentStream(stream);
        setFinalData(data);
    }

    useEffect(() => {
        if (tmdbData) {
            fetchContent();
        }
    }, [tmdbData]);

    useEffect(() => {
        params.then(({ data }) => {
            try {
                const decoded = JSON.parse(atob(decodeURIComponent(data))) as PlayerData;
                setPlayerData(decoded);

                getMovies(parseInt(decoded.id), decoded.type === "movie" ? "movie" : "tv")
                    .then(setTmdbData)
                    .catch((err) => {
                        console.error("Failed to fetch TMDB data:", err);
                        setError("Failed to fetch media data");
                    });
            } catch (e) {
                console.error("Failed to decode player data:", e);
                setError("Invalid player data");
            }
        });
    }, []);

    function HLSPlayer({ url, ...props }: { url: string }) {
        const videoRef = useRef<HTMLVideoElement | null>(null);

        useEffect(() => {
            if (Hls.isSupported() && videoRef.current) {
                const hls = new Hls();
                hls.loadSource(url);
                hls.attachMedia(videoRef.current);

                return () => {
                    hls.destroy();
                };
            }
        }, [url]);

        return <video ref={videoRef} {...props} />;
    }

    function URLPlayer({ url, ...props }: { url: string }) {
        return <video src={url} {...props} />;
    }

    const videoProps = {
        controls: true,
        autoPlay: true,
        style: { maxWidth: "100%", maxHeight: "100%", objectFit: 'contain' },
    }

    return (
        <div style={{
            height: "100dvh",
            width: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: '#0b0d0e',
            overflow: "hidden", textAlign: 'center'
        }}>
            {!finalData && <div style={{ display: 'flex', flexDirection: 'column' }}>
                <img src="/assets/mvs_watermark.png" style={{ width: '200px', margin: '0 auto' }} />
                <p style={{ color: 'white', textAlign: 'center' }}>Loading your media...</p>
                <span style={{ color: '#888', fontSize: '14px' }}><i>Mediaslay's ad-free player is in beta.</i></span>
            </div>}
            {(currentStream) && (
                <div style={{ maxWidth: "100%", maxHeight: "100%", display: "flex" }}>
                    {currentStream?.type === "hls" ? (
                        <HLSPlayer {...videoProps} url={currentStream.url} />
                    ) : (
                        <URLPlayer {...videoProps} url={currentStream.url} />
                    )}
                </div>
            )}
            {finalData && !currentStream && <div style={{ display: 'flex', flexDirection: 'column' }}>
                <img src="/assets/mvs_watermark.png" style={{ width: '200px', margin: '0 auto' }} />
                <p style={{ color: "#aaa" }}>No playable stream found.
                    <br />Switch sources via the <i className="fas fa-dice-one"></i><i className="fas fa-dice-two"></i><i className="fas fa-dice-three"></i> buttons</p>
            </div>}
            {error && <p style={{ color: "red" }}>{error}</p>}
        </div>
    );
}