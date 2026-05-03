"use client";

import { getMovies } from "@/app/components/useTMDB";
import { TMDBMovie } from "@/app/movie/page";
import { TMDBShow } from "@/app/series/page";
import { FebboxAPI, FebboxReply } from "@/app/utils/FebboxAPI";
import { useEffect, useRef, useState } from "react";
import Hls from "hls.js";
import { VidrockAPI } from "@/app/utils/VidrockAPI";
import { AnyEmbedAPI } from "@/app/utils/AnyEmbedAPI";

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
    data: FebboxReply | any; // FebboxReply is a bit misleading - all apis are parsed to that interface now
};
type Caption = {
    type: "vtt" | "srt";
    label: string;
    language: string;
    url: string;
};


function HLSPlayer({ url, subtitles, ...props }: { url: string, subtitles?: Caption[] }) {
    const videoRef = useRef<HTMLVideoElement | null>(null);

    useEffect(() => {
        if (Hls.isSupported() && videoRef.current) {
            const hls = new Hls();
            const video = videoRef.current;
            hls.loadSource(url);
            hls.attachMedia(videoRef.current);

            hls.on(Hls.Events.MANIFEST_PARSED, () => {
                const tracks = video.textTracks;
                if (tracks?.length) {
                    tracks[0].mode = "showing";
                }
            });

            return () => {
                hls.destroy();
            };
        }
    }, [url]);

    return <video ref={videoRef} {...props}>
        {subtitles?.filter(s => s.type === 'vtt').map((sub, idx) => (
            <track key={idx} label={sub.label} kind="captions" srcLang={sub.language} src={sub.url} default={idx === 0} />
        ))}
    </video>
}

function URLPlayer({ url, subtitles, ...props }: { url: string, subtitles?: Caption[] }) {
    return <video src={url} {...props}>
        {subtitles?.filter(s => s.type === 'vtt').map((sub, idx) => (
            <track key={idx} label={sub.label} kind="captions" srcLang={sub.language} src={sub.url} default={idx === 0} />
        ))}
    </video>
}

export default function PlayerPage({ params }: MovieProps) {
    const [playerData, setPlayerData] = useState<PlayerData | null>(null);
    const [error, setError] = useState<string | null>(null);

    const [tmdbData, setTmdbData] = useState<TMDBMovie | TMDBShow | null>(null);

    const [allFinalDatas, setAllFinalDatas] = useState<FinalData[]>([]);
    const [allCaptions, setAllCaptions] = useState<Caption[]>([]);

    const [allStreams, setAllStreams] = useState<{ label: string; type: string; url: string }[]>([]);
    const [currentStream, setCurrentStream] = useState<{ type: string; url: string } | null>(null);

    async function fetchContent() {
        const streams: { label: string; type: string; url: string }[] = [];
        const finalDatas: FinalData[] = [];
        const captions: Caption[] = [];

        const name = (playerData?.type === "movie" ? (tmdbData as TMDBMovie)?.title : (tmdbData as TMDBShow)?.name) || "";
        const year = playerData?.type === "movie"
            ? (tmdbData as TMDBMovie)?.release_date?.split("-")[0]
            : (tmdbData as TMDBShow)?.first_air_date?.split("-")[0];

        // guess
        function captionType(url: string): "vtt" | "srt" {
            return url.includes(".vtt") ? "vtt" : "srt";
        }

        // 1. febbox
        try {
            const febbox = await FebboxAPI.search(name, year, playerData?.season, playerData?.episode);
            finalDatas.push({ from: "febbox", data: febbox });
            for (const [res, s] of Object.entries(febbox.streams)) {
                if (s) streams.push({ label: `Febbox ${res}`, ...(s as any) });
            }
            // FebboxReply subtitles come back in FedDB shape: flat keyed object
            for (const [, sub] of Object.entries(febbox.subtitles ?? {})) {
                const s = sub as any;
                const url: string = s.subtitle_link ?? s.url ?? "";
                if (!url) continue;
                captions.push({
                    type: captionType(url),
                    label: s.subtitle_name ?? s.label ?? "",
                    language: s.subtitle_name ?? s.language ?? "",
                    url: `/api/subtitle-wrap?url=${encodeURIComponent(url)}`,
                });
            }
        } catch (err) {
            console.error("Failed to fetch from Febbox:", err);
        }

        // 2. vidrock (no captions)
        try {
            const vidrock = await VidrockAPI.search(
                playerData!.id,
                playerData!.type === "movie" ? "movie" : "tv",
                playerData!.season?.toString() || "1",
                playerData!.episode?.toString() || "1"
            );
            if (vidrock) {
                finalDatas.push({ from: "vidrock", data: vidrock });
                const hlsSources = vidrock.hls?.filter((s: any) => !s.url.includes("storrrrrrm.site")) ?? [];
                for (const s of hlsSources) streams.push({ label: `Vidrock HLS`, type: "hls", url: s.url });
                const resolutions = Object.keys(vidrock.mp4 ?? {}).map(Number).sort((a, b) => b - a);
                for (const res of resolutions) {
                    if (vidrock.mp4[res]?.url) streams.push({ label: `Vidrock ${res}p`, type: "mp4", url: vidrock.mp4[res].url });
                }
            }
        } catch (err) {
            console.error("Failed to fetch from Vidrock:", err);
        }

        // 3. AnyEmbed
        try {
            const api = new AnyEmbedAPI();
            const res = await api.stream(playerData!.id);
            const ae = await res.json();
            finalDatas.push({ from: "anyembed", data: ae });
            for (const source of ae.sources ?? []) {
                for (const s of source.streams ?? []) {
                    if (s.requires_proxy) {
                        streams.push({ label: `AnyEmbed`, type: s.format, url: `https://api.anyembed.xyz` + await api.genProxyURL(s.url, s.headers) });
                    } else {
                        streams.push({ label: `AnyEmbed`, type: s.format, url: s.url });
                    }
                    // AnyEmbed subtitles live on each stream object
                    for (const sub of s.subtitles ?? []) {
                        const url: string = sub.url ?? "";
                        if (!url) continue;
                        captions.push({
                            type: captionType(url),
                            label: sub.label ?? sub.language ?? "",
                            language: sub.language ?? sub.label ?? "",
                            url: `/api/subtitle-wrap?url=${encodeURIComponent(url)}`,
                        });
                    }
                }
            }
        } catch (err) {
            console.error("Failed to fetch from AnyEmbed:", err);
        }

        // dedupe captions by URL
        const seen = new Set<string>();
        // captions language & label are usually "English" or "en-us".
        const userLang = navigator.language;
        const userLangLabel = new Intl.DisplayNames([navigator.language], { type: "language" }).of(userLang);

        const dedupedCaptions = captions.filter(c => {
            if (seen.has(c.url)) return false;
            seen.add(c.url);
            return true;
        }).sort((a, b) => a.label.localeCompare(b.label)).sort((a, b) => {
            const aLang = a.language.toLowerCase();
            const bLang = b.language.toLowerCase();
            if (aLang === userLang || a.label === userLangLabel) return -1;
            if (bLang === userLang || b.label === userLangLabel) return 1;
            if (aLang.startsWith("en")) return -1;
            if (bLang.startsWith("en")) return 1;
            return 0;
        });

        setAllStreams(streams);
        setCurrentStream(streams[0] ?? null);
        setAllFinalDatas(finalDatas);
        setAllCaptions(dedupedCaptions);
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

    const videoProps = {
        controls: true,
        autoPlay: true,
        style: { maxWidth: "100%", maxHeight: "100%", objectFit: 'contain', height: '100vh' },
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
            {allFinalDatas.length === 0 && <div style={{ display: 'flex', flexDirection: 'column' }}>
                <img src="/assets/mvs_watermark.png" style={{ width: '200px', margin: '0 auto' }} />
                <p style={{ color: 'white', textAlign: 'center' }}>Loading your media...</p>
                <span style={{ color: '#888', fontSize: '14px' }}><i>Mediaslay's ad-free player is in beta.</i></span>
            </div>}
            {(currentStream) && (
                <div style={{ maxWidth: "100%", maxHeight: "100%", display: "flex" }}>
                    {currentStream?.type === "hls" ? (
                        <HLSPlayer {...videoProps} url={currentStream.url} subtitles={allCaptions} />
                    ) : (
                        <URLPlayer {...videoProps} url={currentStream.url} subtitles={allCaptions} />
                    )}
                </div>
            )}
            {allFinalDatas.length > 0 && allStreams.length === 0 && <div style={{ display: 'flex', flexDirection: 'column' }}>
                <img src="/assets/mvs_watermark.png" style={{ width: '200px', margin: '0 auto' }} />
                <p style={{ color: "#aaa" }}>No playable stream found.
                    <br />Switch sources via the <i className="fas fa-dice-one"></i><i className="fas fa-dice-two"></i><i className="fas fa-dice-three"></i> buttons</p>
            </div>}
            {error && <p style={{ color: "red" }}>{error}</p>}
        </div>
    );
}