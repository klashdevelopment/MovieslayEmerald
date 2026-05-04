"use client";

import { getMovies } from "@/app/components/useTMDB";
import { TMDBMovie } from "@/app/movie/page";
import { TMDBShow } from "@/app/series/page";
import { FebboxAPI, FebboxReply } from "@/app/utils/FebboxAPI";
import { useEffect, useRef, useState } from "react";
import Hls from "hls.js";
import { VidrockAPI } from "@/app/utils/VidrockAPI";
import { AnyEmbedAPI } from "@/app/utils/AnyEmbedAPI";
import { VylaAPI } from "@/app/utils/VylaAPI";
import "./player-imports.css";
import { Button, CssVarsProvider, Drawer, List, ListItem, ListItemButton, Option, Select, Slider, Tooltip } from "@mui/joy";


function randomUUID() {
    // https://stackoverflow.com/a/8809472
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
        var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}

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
    from: "febbox" | "anyembed" | "vidrock" | "vyla";
    data: FebboxReply | any; // FebboxReply is a bit misleading - all apis are parsed to that interface now
};
type Caption = {
    type: "vtt" | "srt";
    label: string;
    language: string;
    url: string;
    uuid: string;
};


function HLSPlayer({ url, subtitleEnabled, videoRef, ...props }: { url: string, videoRef: React.RefObject<HTMLVideoElement>, subtitleEnabled?: Caption } & React.VideoHTMLAttributes<HTMLVideoElement>) {
    useEffect(() => {
        if (Hls.isSupported() && videoRef.current) {
            const hls = new Hls();
            const video = videoRef.current;
            hls.loadSource(url);
            hls.attachMedia(videoRef.current);

            return () => {
                hls.destroy();
            };
        }
    }, [url]);

    return <video ref={videoRef} {...props}>
        {subtitleEnabled && (
            <track key={'subtitle-' + subtitleEnabled.uuid} label={subtitleEnabled.label} kind="captions" srcLang={subtitleEnabled.language} src={subtitleEnabled.url} default />
        )}
    </video>
}

function URLPlayer({ url, subtitleEnabled, videoRef, ...props }: { url: string, videoRef: React.RefObject<HTMLVideoElement>, subtitleEnabled?: Caption }) {
    return <video ref={videoRef} src={url} {...props}>
        {subtitleEnabled && (
            <track key={'subtitle-' + subtitleEnabled.uuid} label={subtitleEnabled.label} kind="captions" srcLang={subtitleEnabled.language} src={subtitleEnabled.url} default />
        )}
    </video>
}

export default function PlayerPage({ params }: MovieProps) {
    const [playerData, setPlayerData] = useState<PlayerData | null>(null);
    const [error, setError] = useState<string | null>(null);

    const [tmdbData, setTmdbData] = useState<TMDBMovie | TMDBShow | null>(null);

    const [allFinalDatas, setAllFinalDatas] = useState<FinalData[]>([]);
    const [allCaptions, setAllCaptions] = useState<Caption[]>([]);
    const [currentCaption, setCurrentCaption] = useState<Caption | undefined>(undefined);

    const [allStreams, setAllStreams] = useState<{ label: string; type: string; url: string, uuid: string }[]>([]);
    const [currentStream, setCurrentStream] = useState<{ label: string; type: string; url: string, uuid: string } | null>(null);

    async function fetchContent() {
        const name = (playerData?.type === "movie" ? (tmdbData as TMDBMovie)?.title : (tmdbData as TMDBShow)?.name) || "";
        const year = playerData?.type === "movie"
            ? (tmdbData as TMDBMovie)?.release_date?.split("-")[0]
            : (tmdbData as TMDBShow)?.first_air_date?.split("-")[0];

        function captionType(url: string): "vtt" | "srt" {
            return url.includes(".vtt") ? "vtt" : "srt";
        }

        // Shared mutable state, written by each settler as it resolves
        const allStreams: { label: string; type: string; url: string; uuid: string }[] = [];
        const allCaptions: Caption[] = [];
        const allFinalDatas: FinalData[] = [];
        let firstStreamSet = false;

        function commitResults(
            newStreams: typeof allStreams,
            newCaptions: Caption[],
            finalData?: FinalData
        ) {
            allStreams.push(...newStreams);
            allCaptions.push(...newCaptions);
            if (finalData) allFinalDatas.push(finalData);

            if (!firstStreamSet && allStreams.length > 0) {
                setCurrentStream(allStreams[0]);
                firstStreamSet = true;
            }
            setAllStreams([...allStreams]);
            setAllFinalDatas([...allFinalDatas]);
        }

        const tasks = [
            // Febbox
            (async () => {
                const febbox = await FebboxAPI.search(name, year, playerData?.season, playerData?.episode);
                const streams = [];
                const captions = [];
                for (const [res, s] of Object.entries(febbox.streams)) {
                    if (s) streams.push({ label: `Febbox ${res}`, ...(s as any), uuid: randomUUID() });
                }
                for (const [, sub] of Object.entries(febbox.subtitles ?? {})) {
                    const s = sub as any;
                    const url: string = s.subtitle_link ?? s.url ?? "";
                    if (!url) continue;
                    captions.push({
                        type: captionType(url),
                        label: "FB " + (s.subtitle_name ?? s.label ?? "") + '(' + (captions.length + 1) + ')',
                        language: s.language ?? s.subtitle_name ?? "",
                        url: `/api/subtitle-wrap?url=${encodeURIComponent(url)}`,
                        uuid: randomUUID(),
                    });
                }
                commitResults(streams, captions, { from: "febbox", data: febbox });
            })(),

            // Vyla
            (async () => {
                const vyla = await VylaAPI.search(playerData!.id, playerData!.type === 'series' ? 'tv' : 'movie', playerData!.season + "", playerData!.episode + "");
                if (!vyla) return;
                const streams = (vyla.sources ?? []).map((s: any) => ({
                    label: `Vyla ${s.label} / ${s.source}`,
                    type: s.url.includes(".m3u8") ? "hls" : "mp4",
                    url: s.url,
                    uuid: randomUUID(),
                }));
                commitResults(streams, [], { from: "vyla", data: vyla });
            })(),

            // AnyEmbed
            (async () => {
                const api = new AnyEmbedAPI();
                const res = await api.stream(playerData!.id, playerData!.season?.toString(), playerData!.episode?.toString());
                const ae = await res.json();
                const streams = [];
                const captions = [];
                for (const source of ae.sources ?? []) {
                    for (const s of source.streams ?? []) {
                        const url = s.requires_proxy
                            ? `https://api.anyembed.xyz` + await api.genProxyURL(s.url, s.headers)
                            : s.url;
                        const format = s.format ? (s.format === "m3u8" ? "hls" : s.format) : (url.includes(".m3u8") ? "hls" : "mp4");
                        streams.push({ label: `AnyEmbed ${format} ${s.quality}`, type: format, url, uuid: randomUUID() });
                        for (const sub of s.subtitles ?? []) {
                            const subUrl: string = sub.url ?? "";
                            if (!subUrl) continue;
                            captions.push({
                                type: captionType(subUrl),
                                label: "AE " + (sub.label ?? sub.language ?? ""),
                                language: sub.language ?? sub.label ?? "",
                                url: `/api/subtitle-wrap?url=${encodeURIComponent(subUrl)}`,
                                uuid: randomUUID(),
                            });
                        }
                    }
                }
                commitResults(streams, captions, { from: "anyembed", data: ae });
            })(),

            // Vidrock
            (async () => {
                const vidrock = await VidrockAPI.search(
                    playerData!.id,
                    playerData!.type === "movie" ? "movie" : "tv",
                    playerData!.season?.toString() || "1",
                    playerData!.episode?.toString() || "1"
                );
                if (!vidrock) return;
                const streams = [];
                for (const s of (vidrock.hls ?? []).filter((s: any) => !s.url.includes("storrrrrrm.site"))) {
                    streams.push({ label: `Vidrock HLS`, type: "hls", url: s.url, uuid: randomUUID() });
                }
                for (const res of Object.keys(vidrock.mp4 ?? {}).map(Number).sort((a, b) => b - a)) {
                    if (vidrock.mp4[res]?.url) streams.push({ label: `Vidrock ${res}p`, type: "mp4", url: vidrock.mp4[res].url, uuid: randomUUID() });
                }

                const subs = vidrock.subs ?? [];
                const captions = [];
                // subs is a {label, file}[]
                for (const sub of subs) {
                    const subUrl: string = sub.file ?? "";
                    if (!subUrl) continue;
                    captions.push({
                        type: captionType(subUrl),
                        label: "VR " + ((sub.label || subUrl.split('/').pop()) ?? ""),
                        language: sub.language ?? sub.label ?? "",
                        url: `/api/subtitle-wrap?url=${encodeURIComponent(subUrl)}`,
                        uuid: randomUUID(),
                    });
                }
                commitResults(streams, captions, { from: "vidrock", data: vidrock });
            })(),
        ];

        await Promise.allSettled(tasks);

        // Final caption dedup + sort after all sources settled
        const seen = new Set<string>();
        const userLang = navigator.language;
        const userLangLabel = new Intl.DisplayNames([userLang], { type: "language" }).of(userLang);
        const dedupedCaptions = allCaptions
            .filter(c => !seen.has(c.url) && seen.add(c.url))
            .sort((a, b) => a.label.localeCompare(b.label))
            .sort((a, b) => {
                const aLang = a.language.toLowerCase();
                const bLang = b.language.toLowerCase();
                if (aLang === userLang || a.label === userLangLabel) return -1;
                if (bLang === userLang || b.label === userLangLabel) return 1;
                if (aLang.startsWith("en")) return -1;
                if (bLang.startsWith("en")) return 1;
                return 0;
            });

        setAllCaptions(dedupedCaptions);
    }

    function loadDummy() {
        const dummyVTT = `WEBVTT

00:00:00.000 --> 01:00:00.000
Example Caption
`;
        const allstream = ([{ uuid: randomUUID(), label: "Dummy Stream", type: "hls", url: "https://vyla-api.pages.dev/api?url=https%3A%2F%2Ffast.randomspeedster.com%2FhSFaX1dkOAqCd1g24uJ16AoooOX3ppgaWv0Nz2pwxXjFb53ZKjtQhmD3oSI9_cy4jkJToqE43AjZ9wtWWSrb-i0D4-xyByRhB-dHPBgTnBUja-lk_c08zdmCe5Sk12ZxT2Hzr1PveHelGeFVm6SMhcVPLroEYZIGMinLPkpdx1iyzjl6PvCiq0gxWYDdy4NDSPsDRsy9WFP9UD5EMMA2U8dCuc1RCLJjArDUK8Gt1szyc93tWZTWRpHWTclTXyuvkZA8l7oPfLyQvIO0IDdW_cCDLQcfZYJNbrqnV_CypmKstFqESZA0togQpp05vI9eL0qHpHQUn9vwNTAi3C04LIqivfO2evgEwZPMpJTSs9UM6mkAlA-F8q27xjXkxDuNlPv2wUhMLae6gCrJFIiT_Q-IwVhjmM-3UfO3LOXz8ENGu0NsvrNFBix353VG12iGuLeFd8F7kxnP4caM-4rkhj4Ay_w-LtQ3Zwqyr1XWKaZJRdFxpunv1N21r5RW2fDoJ6rTx7hF8AHo55hNoOD--JWueBW2UPmmHQB0Wno1jGvGoFl7olxdw3N8_C75EnsExjbx-tg2wHCzXacxh_8ctQKbHB8M67R4BDJbvVK0mQIA%2Findex.m3u8&vy=1" }]);
        const blob = new Blob([dummyVTT], { type: "text/vtt" });
        const url = URL.createObjectURL(blob);
        setAllCaptions([{ type: "vtt", label: "Example Caption", language: "en", url, uuid: randomUUID() }]);
        setAllFinalDatas([{ from: "febbox", data: { streams: {}, subtitles: {} } }]);
        setCurrentStream(allstream[0]);
        setAllStreams(allstream);
    }

    useEffect(() => {
        if (tmdbData) {
            fetchContent();
            // loadDummy();
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

    const videoRef = useRef<HTMLVideoElement>(null);

    const playPause = () => {
        const video = document.querySelector('.mvs-player-content') as HTMLVideoElement | null;
        if (!video) return;
        if (video.paused) {
            video.play();
            setVideoIsPaused(false);
        } else {
            video.pause();
            setVideoIsPaused(true);
        }
    }

    const videoProps: React.VideoHTMLAttributes<HTMLVideoElement> = {
        controls: false,
        autoPlay: true,
        style: { maxWidth: "100%", maxHeight: "100%", objectFit: 'contain', height: '100vh', width: '100%' },
        className: "mvs-player-content",
        onClick: playPause,
        onMouseMove: () => {
            setShowControls(true);
            setTimeout(() => setShowControls(false), 3000);
        },
        onTimeUpdate: (e) => {
            setCurrentTime(e.currentTarget.currentTime);
            setDuration(e.currentTarget.duration);
            setVideoIsPaused(e.currentTarget.paused);
        },
        onLoadedMetadata: (e) => {
            setDuration(e.currentTarget.duration);
            setVideoLoading(false);
        }
    }

    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);

    const [videoIsPaused, setVideoIsPaused] = useState(false);

    const [showControls, setShowControls] = useState(false);
    const [showServerSelect, setShowServerSelect] = useState(false);
    const [showCaptionSelect, setShowCaptionSelect] = useState(false);

    const formatTime = (s: number) => {
        const hours = Math.floor(s / 3600);
        const minutes = Math.floor((s % 3600) / 60);
        const seconds = Math.floor(s % 60);

        if (isNaN(hours) || isNaN(minutes) || isNaN(seconds)) return "?:??";

        return hours > 0
            ? `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
            : `${minutes}:${seconds.toString().padStart(2, '0')}`;
    };

    const [videoLoading, setVideoLoading] = useState(true);

    function keyPresses(e: React.KeyboardEvent<HTMLDivElement>) {
        if (e.code === "Space") {
            e.preventDefault();
            playPause();
        }
        // left arrow / right arrow
        if (e.code === "ArrowLeft" || e.code === "ArrowRight") {
            e.preventDefault();
            const video = videoRef.current;
            if (video) {
                video.currentTime += e.code === "ArrowLeft" ? -5 : 5;
                setCurrentTime(video.currentTime);
            }
        }
    }

    return (
        <CssVarsProvider defaultMode="dark">
            <div className="mvs-player-root" style={{
                height: "100dvh",
                width: "100%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                background: '#0b0d0e',
                overflow: "hidden", textAlign: 'center'
            }} onKeyDown={keyPresses} tabIndex={0}>
                {allFinalDatas.length === 0 && <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <img src="/assets/mvs_watermark.png" style={{ width: '200px', margin: '0 auto' }} />
                    <p style={{ color: 'white', textAlign: 'center' }}>Loading your media...</p>
                    <span style={{ color: '#888', fontSize: '14px' }}><i>Mediaslay's ad-free player is in beta.</i></span>
                </div>}
                {(currentStream) && (
                    <div style={{ maxWidth: "100%", maxHeight: "100%", display: "flex", width: "100%", height: "100%", alignItems: "center", justifyContent: "center", position: "relative" }}>
                        <i className={`fas fa-${videoLoading ? 'sync fa-fade' : 'pause'}`} style={{
                            position: "absolute",
                            top: "50%",
                            left: "50%",
                            transform: "translate(-50%, -50%)",
                            fontSize: "64px",
                            color: "rgba(255, 255, 255, 0.7)",
                            pointerEvents: "none",
                            opacity: (videoIsPaused || videoLoading) ? 1 : 0,
                            transition: "opacity 0.3s",
                        }}></i>
                        {currentStream?.type === "hls" ? (
                            <HLSPlayer {...videoProps} videoRef={videoRef} url={currentStream.url} subtitleEnabled={currentCaption} />
                        ) : (
                            <URLPlayer {...videoProps} videoRef={videoRef} url={currentStream.url} subtitleEnabled={currentCaption} />
                        )}
                        <div style={{ position: "absolute", bottom: "0", left: "0", height: "50px", display: `${
                            showControls ? "flex" : "none"
                        }`, flexDirection: 'column', width: "calc(100% - 20px)", marginLeft: '10px', background: "linear-gradient(transparent, rgba(0,0,0,0.7))" }}>
                            <Slider
                                size="sm"
                                value={duration ? (currentTime / duration) * 100 : 0}
                                onChange={(e, value) => {
                                    const video = videoRef.current;
                                    if (video) {
                                        video.currentTime = (value as number / 100) * duration;
                                        setCurrentTime(video.currentTime);
                                    }
                                }}
                                disabled={videoLoading}
                                sx={{
                                    color: 'primary.main',
                                    padding: '6px 0',
                                    '& .MuiSlider-thumb': {
                                        width: 12,
                                        height: 12,
                                        backgroundColor: '#fff',
                                        border: '2px solid currentColor',
                                    },
                                    '& .MuiSlider-rail': {
                                        opacity: 0.3,
                                        backgroundColor: '#fff',
                                    },
                                }}
                            />
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0 10px", color: "white", fontSize: "14px" }}>
                                <div style={{
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    height: "30px",
                                }}>
                                    <Tooltip title={videoIsPaused ? "Play" : "Pause"} variant={'plain'}>
                                    <i className={`control-icon fas fa-${videoLoading ? `sync fa-spin` : (videoIsPaused ? "play" : "pause")}`} style={{ marginRight: "8px" }} onClick={() => {
                                        if (videoLoading) return;
                                        playPause();
                                    }}></i>
                                    </Tooltip>
                                    <span>{formatTime(currentTime)}</span>
                                    <span> / </span>
                                    <span>{formatTime(duration)}</span>
                                </div>
                                <div style={{
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    height: "30px",
                                }}>
                                    <Tooltip title="Select Stream" variant={'plain'}>
                                        <i className="control-icon fas fa-server" onClick={() => setShowServerSelect(!showServerSelect)}></i>
                                    </Tooltip>
                                    <Drawer
                                        anchor="right"
                                        open={showServerSelect}
                                        onClose={() => setShowServerSelect(false)}
                                    >
                                        <div style={{ padding: "0px" }}>
                                            <List>
                                                <ListItem>
                                                    <ListItemButton onClick={() => {
                                                        setShowServerSelect(false);
                                                    }}>
                                                        <i className="fas fa-arrow-left" style={{ marginRight: "8px" }}></i>
                                                        Back
                                                    </ListItemButton>
                                                </ListItem>
                                                <ListItem>
                                                    <i className="fas fa-database" style={{ marginRight: "8px" }}></i>
                                                    Select Stream
                                                </ListItem>
                                                {allStreams.map((stream) => (
                                                    <ListItem
                                                        key={stream.uuid}
                                                        value={stream.uuid}
                                                        onClick={() => {
                                                            setCurrentStream(stream);
                                                            setShowServerSelect(false);
                                                            setVideoLoading(true);
                                                        }}
                                                    >
                                                        <ListItemButton selected={currentStream?.uuid === stream.uuid}>
                                                            <i className={`fas fa-${stream.type === "hls" ? "stream" : "file-video"}`} style={{ marginRight: "8px" }}></i>
                                                            {stream.label}
                                                        </ListItemButton>
                                                    </ListItem>
                                                ))}
                                            </List>
                                        </div>
                                    </Drawer>

                                    <Tooltip title="Select Subtitle" variant={'plain'}>
                                        <i className="control-icon fas fa-closed-captioning" onClick={() => setShowCaptionSelect(!showCaptionSelect)}></i>
                                    </Tooltip>
                                    <Drawer
                                        anchor="right"
                                        open={showCaptionSelect}
                                        onClose={() => setShowCaptionSelect(false)}
                                    >
                                        <div style={{ padding: "0px" }}>
                                            <List>
                                                <ListItem>
                                                    <ListItemButton onClick={() => {
                                                        setShowCaptionSelect(false);
                                                    }}>
                                                        <i className="fas fa-arrow-left" style={{ marginRight: "8px" }}></i>
                                                        Back
                                                    </ListItemButton>
                                                </ListItem>
                                                <ListItem>
                                                    <i className="fas fa-subtitle" style={{ marginRight: "8px" }}></i>
                                                    Select Subtitle
                                                </ListItem>
                                                <ListItem
                                                    key="none"
                                                    value="none"
                                                    onClick={() => {
                                                        setCurrentCaption(undefined);
                                                        setShowCaptionSelect(false);
                                                    }}
                                                >
                                                    <ListItemButton selected={currentCaption === undefined}>
                                                        <i className={`fas fa-closed-captioning-slash`} style={{ marginRight: "8px" }}></i>
                                                        None
                                                    </ListItemButton>
                                                </ListItem>
                                                {allCaptions.sort((a, b) => (a.type === 'vtt' ? -1 : 1)).map((caption) => (
                                                    <ListItem
                                                        key={caption.uuid}
                                                        value={caption.uuid}
                                                        onClick={() => {
                                                            setCurrentCaption(caption);
                                                            setShowCaptionSelect(false);
                                                        }}
                                                    >
                                                        <ListItemButton disabled={caption.type === 'vtt' ? false : true} selected={currentCaption?.uuid === caption.uuid}>
                                                            <i className={`fas fa-${caption.type === "vtt" ? "closed-captioning" : "file-alt"}`} style={{ marginRight: "8px" }}></i>
                                                            {caption.label} ({caption.language})
                                                        </ListItemButton>
                                                        <Button variant="outlined" color={"neutral"} size="sm" onClick={(e) => {
                                                            e.stopPropagation();
                                                            window.open(caption.url, "_blank");
                                                        }} style={{ marginLeft: "8px" }}>
                                                            <i className="fas fa-download"></i>
                                                        </Button>
                                                    </ListItem>
                                                ))}
                                            </List>
                                        </div>
                                    </Drawer>


                                    <Tooltip title={document.fullscreenElement ? "Exit Fullscreen" : "Fullscreen"} variant={'plain'}>
                                        <i className={`control-icon fas fa-${document.fullscreenElement ? "compress" : "expand"}`} onClick={() => {

                                            if (document.fullscreenElement) {
                                                document.exitFullscreen();
                                            } else {
                                                document.documentElement.requestFullscreen();
                                            }
                                        }}></i>
                                    </Tooltip>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
                {allFinalDatas.length > 0 && allStreams.length === 0 && <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <img src="/assets/mvs_watermark.png" style={{ width: '200px', margin: '0 auto' }} />
                    <p style={{ color: "#aaa" }}>No playable stream found.
                        <br />Switch sources via the <i className="fas fa-dice-one"></i><i className="fas fa-dice-two"></i><i className="fas fa-dice-three"></i> buttons</p>
                </div>}
                {error && <p style={{ color: "red" }}>{error}</p>}
            </div>
        </CssVarsProvider>
    );
}