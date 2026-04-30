"use client";

import { getMovies } from "@/app/components/useTMDB";
import { TMDBMovie } from "@/app/movie/page";
import { TMDBShow } from "@/app/series/page";
import { FebboxAPI, FebboxReply } from "@/app/utils/FebboxAPI";
import { useEffect, useRef, useState } from "react";
import Hls from "hls.js";

interface MovieProps {
    params: Promise<{ data: string }>;
}

interface PlayerData {
    id: string;
    type: "movie" | "series";
    season?: number;
    episode?: number;
}

export default function PlayerPage({ params }: MovieProps) {
    const [playerData, setPlayerData] = useState<PlayerData | null>(null);
    const [error, setError] = useState<string | null>(null);

    const [tmdbData, setTmdbData] = useState<TMDBMovie | TMDBShow | null>(null);

    const [finalData, setFinalData] = useState<{
        from: "febbox" | "anyembed";
        data: FebboxReply | any; // AnyEmbed is still in heavy beta, so we'll implement it as needed in the future lol
    } | null>(null);

    const [currentStream, setCurrentStream] = useState<{ type: string; url: string } | null>(null);

    async function fetchContent() {
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
            setFinalData({ from: "febbox", data: febbox });
            setCurrentStream(febbox.streams['1080P'] || febbox.streams['720P'] || febbox.streams['360P'] || febbox.streams[Object.keys(febbox.streams)[0]]); // Try 1080P, then 720P, then 360P, then whatever the first one is
        } catch (err) {
            console.error("Failed to fetch from Febbox:", err);
        }

        // 2. anyembed (if febbox fails)
        if (!febbox) {
            console.log("Febbox failed, try AnyEmbed now (TODO actually do that)");
        }
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
            overflow: "hidden",textAlign:'center'
        }}>
            {!finalData && <div style={{ display: 'flex', flexDirection: 'column' }}>
                <img src="/assets/mvs_watermark.png" style={{ width: '200px', margin: '0 auto' }} />
                <p style={{ color: 'white', textAlign: 'center' }}>Loading your media...</p>
                <span style={{ color: '#888', fontSize: '14px' }}><i>Mediaslay's ad-free player is in beta.</i></span>
            </div>}
            {(finalData?.from === "febbox" && currentStream) && (
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