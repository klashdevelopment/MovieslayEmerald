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
import { Button, CircularProgress, CssVarsProvider, Drawer, LinearProgress, List, ListItem, ListItemButton, Option, Select, Slider, Tooltip } from "@mui/joy";
import { HLSDownloader } from "./HLSDownloader";


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
    from: "febbox" | "anyembed" | "vidrock" | "vyla" | string;
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

async function validateStream(stream: { type: string; url: string }): Promise<boolean> {
    try {
        if (stream.type === "hls") {
            // for m3u8, fetch and check it's actually a playlist
            const res = await fetch(stream.url, { signal: AbortSignal.timeout(5000) });
            if (!res.ok) return false;
            const text = await res.text();
            return text.includes("#EXTM3U");
            // return true;
        } else {
            // for mp4, just check the response is ok and isn't 'no'
            const res = await fetch(stream.url, { method: "HEAD", signal: AbortSignal.timeout(5000) });
            if (!res.ok) return false;
            const ct = res.headers.get("content-type") ?? "";
            return ct.includes("video") || ct.includes("octet-stream");
        }
    } catch {
        return false;
    }
}

const sources = ['febboxpstream', 'febbox', 'anyembed', 'vidrock', 'vyla', '123anime', 'xpass', 'lmscript', 'lookmovies'] as const;

export default function PlayerPage({ params }: MovieProps) {
    const [playerData, setPlayerData] = useState<PlayerData | null>(null);
    const [error, setError] = useState<string | null>(null);

    const [tmdbData, setTmdbData] = useState<TMDBMovie | TMDBShow | null>(null);

    const [allFinalDatas, setAllFinalDatas] = useState<FinalData[]>([]);
    const [allCaptions, setAllCaptions] = useState<Caption[]>([]);
    const [currentCaption, setCurrentCaption] = useState<Caption | undefined>(undefined);

    const [allStreams, setAllStreams] = useState<{ label: string; type: string; url: string, uuid: string }[]>([]);
    const [currentStream, setCurrentStream] = useState<{ label: string; type: string; url: string, uuid: string } | null>(null);
    const [pendingTasks, setPendingTasks] = useState<number>(sources.length);
    const [pendingTasksMax, setPendingTasksMax] = useState<number>(sources.length);

    async function fetchContent() {
        setPendingTasks(sources.length);

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
            // Febbox but it uses pstream wrapper and barely functions
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
                const validStreams = (await Promise.all(
                    streams.map(async s => (await validateStream(s) ? s : null))
                )).filter(Boolean) as typeof streams;
                commitResults(validStreams, captions, { from: "febboxpstream", data: febbox });
                setPendingTasks((p) => p - 1);
            })(),

            // Febbox but we did the wrapper
            (async () => {
                const type = playerData!.type === "movie" ? "movie" : "tv";
                const name = (playerData!.type === "movie" ? (tmdbData as TMDBMovie)?.title : (tmdbData as TMDBShow)?.name) || "";
                const season = playerData!.season?.toString() || undefined;
                const episode = playerData!.episode?.toString() || undefined;

                const res = await fetch(`/api/febbox-wrap?type=${type}&query=${encodeURIComponent(name)}${season ? `&season=${season}` : ""}${episode ? `&episode=${episode}` : ""}`);
                const data = await res.json();
                console.log(data);
                const streams = (data.sources ?? []).map((s: any) => ({
                    label: `Febbox ${s.label}`,
                    type: 'hls',
                    url: s.file,
                    uuid: randomUUID(),
                }));
                const validStreams = (await Promise.all(
                    streams.map(async (s: any) => (await validateStream(s) ? s : null))
                )).filter(Boolean) as typeof streams;
                commitResults(validStreams, [], { from: "febbox", data: data });
                setPendingTasks((p) => p - 1);
            })(),

            // Lookmovies
            (async () => {
                const tmdbId = tmdbData?.id;
                if (!tmdbId) {
                    setPendingTasks((p) => p - 1);
                    return;
                }
                const res = await fetch(`/api/lookmovies-wrap?name=${encodeURIComponent(name)}&tmdbId=${tmdbId}${playerData?.season ? `&s=${playerData.season}` : ""}${playerData?.episode ? `&e=${playerData.episode}` : ""}`);
                if (!res.ok) {
                    setPendingTasks((p) => p - 1);
                    return;
                }
                const data = await res.json();
                if(!data?.source?.url) {
                    setPendingTasks((p) => p - 1);
                    return;
                }
                const stream = {
                    label: `Lookmovies ${data.source.quality}`,
                    type: data.source.url.includes(".m3u8") ? "hls" : "mp4",
                    url: data.source.url,
                    uuid: randomUUID(),
                };
                const valid = await validateStream(stream);
                if (valid) {
                    commitResults([stream], [], { from: "lookmovies", data });
                }
            })(),

            // Lmscript
            (async () => {
                const tmdbId = tmdbData?.id;
                if (!tmdbId) {
                    setPendingTasks((p) => p - 1);
                    return;
                }
                const res = await fetch(`/api/lmscript-wrap?name=${encodeURIComponent(name)}&tmdbId=${tmdbId}${playerData?.season ? `&s=${playerData.season}` : ""}${playerData?.episode ? `&e=${playerData.episode}` : ""}`);
                if (!res.ok) {
                    setPendingTasks((p) => p - 1);
                    return;
                }
                const data = await res.json();
                if(!data?.source?.url) {
                    setPendingTasks((p) => p - 1);
                    return;
                }
                const stream = {
                    label: `Lmscript ${data.source.quality}`,
                    type: data.source.url.includes(".m3u8") ? "hls" : "mp4",
                    url: data.source.url,
                    uuid: randomUUID(),
                };
                const subtitles = (data.subtitles ?? []).map((sub: any) => ({
                    type: sub.type,
                    label: "LMS " + sub.language + '(' + sub.label + ')',
                    url: `/api/subtitle-wrap?url=${encodeURIComponent(sub.url)}`,
                    language: sub.language,
                    uuid: randomUUID(),
                }));
                const valid = await validateStream(stream);
                if (valid) {
                    commitResults([stream], subtitles, { from: "lmscript", data });
                }
            })(),

            // Vyla
            (async () => {
                // const vyla = await VylaAPI.search(playerData!.id, playerData!.type === 'series' ? 'tv' : 'movie', undefined, playerData!.season, playerData!.episode);
                // if (!vyla) return;
                // const streams = (vyla.sources ?? []).map((s: any) => ({
                //     label: `Vyla ${s.label} / ${s.source}`,
                //     type: s.url.includes(".m3u8") ? "hls" : "mp4",
                //     url: s.url,
                //     uuid: randomUUID(),
                // }));
                // const validStreams = (await Promise.all(
                //     streams.map(async (s: any) => (await validateStream(s) ? s : null))
                // )).filter(Boolean) as typeof streams;
                // commitResults(validStreams, [], { from: "vyla", data: vyla });
                // if (validStreams.length > 0 && videoLoading) {
                //     setCurrentStream(validStreams[0]);
                // }
                // The logic above fetches all sources at once, so it takes quite some time.
                // use VylaAPI.getSources(), then add the number of sources to pending, and then have a task
                // for each source to fetch them one by one, committing results as they come in, which should make the player more responsive.

                const sources = await VylaAPI.getSources();
                setPendingTasks((p) => p + sources.length - 1); // -1 because we already have one pending for the initial fetch
                setPendingTasksMax((p) => p + sources.length - 1);
                // Do not wait for each one to finish before starting the next, as some sources are much faster than others and we want to show results as soon as they come in
                for (const source of sources) {
                    (async (source) => {
                        try {
                            const vyla = await VylaAPI.search(playerData!.id, playerData!.type === 'series' ? 'tv' : 'movie', source, playerData!.season, playerData!.episode);
                            if (!vyla || !vyla.url) return;
                            const streams = [
                                {
                                    label: `Vyla ${source.label} / ${source.key}`,
                                    type: vyla.url.includes(".m3u8") ? "hls" : "mp4",
                                    url: vyla.url,
                                    uuid: randomUUID(),
                                }
                            ]
                            const validStreams = (await Promise.all(
                                streams.map(async (s: any) => (await validateStream(s) ? s : null))
                            )).filter(Boolean) as typeof streams;
                            commitResults(validStreams, [], { from: "vyla-" + source.key, data: vyla });
                            setPendingTasks((p) => p - 1);
                        } catch (error) {
                            console.error(`Error fetching Vyla source ${source.key}:`, error);
                        }
                    })(source);
                }

                // now, subtitles!
                try {
                    const subs = await VylaAPI.getSubtitles(playerData!.id, playerData!.type === 'series' ? 'tv' : 'movie', playerData!.season, playerData!.episode);
                    const captions = [];
                    for (const sub of subs) {
                        const url: string = sub.file ?? "";
                        if (!url) continue;
                        captions.push({
                            type: sub.type || captionType(url),
                            label: "Vyla " + (sub.label ?? sub.language ?? "") + '(' + sub.source + '/' + (captions.length + 1) + ')',
                            language: sub.language ?? sub.label ?? "",
                            url: `/api/subtitle-wrap?url=${encodeURIComponent(url)}`,
                            uuid: randomUUID(),
                        });
                    }

                    commitResults([], captions, { from: "vyla-subtitles", data: subs });

                } catch (error) {
                    console.error("Error fetching Vyla subtitles:", error);
                }
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
                for (const s of (vidrock.hls ?? [])) {
                    const urlFilename = s.url.split('/').pop() ?? '';
                    // only get the last part of the url for the label, to avoid it being too long, removing the .m3u8 if present
                    const labelPart = urlFilename.endsWith(".m3u8") ? urlFilename.slice(0, -6) : urlFilename;
                    streams.push({ label: `Vidrock ${labelPart}`, type: "hls", url: s.url, uuid: randomUUID() });
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
                const validStreams = (await Promise.all(
                    streams.map(async s => (await validateStream(s) ? s : null))
                )).filter(Boolean) as typeof streams;
                commitResults(validStreams, captions, { from: "vidrock", data: vidrock });
                setPendingTasks((p) => p - 1);
            })(),

            // XPass
            (async () => {
                try {
                    // xpass-wrap
                    /*/api/xpass-wrap?type=movie&id=687163 | /api/xpass-wrap?type=tv&id=76479&season=5&episode=8 -> {sources: [{id, name}]}

/api/xpass-wrap?type=tv&id=76479&season=5&episode=8&source=SOURCEID / (same for movies, add &source) -> [{file, type, label}]*/
                    // do it similar to Vyla where we first fetch the list of sources, and then for each source we fetch the streams, so that we can show results as they come in instead of waiting for all sources to be fetched before showing anything
                    const type = playerData!.type === "movie" ? "movie" : "tv";
                    const id = playerData!.id;
                    const season = playerData!.season?.toString() || "1";
                    const episode = playerData!.episode?.toString() || "1";
                    const sourcesRes = await fetch(`/api/xpass-wrap?type=${type}&id=${id}&season=${season}&episode=${episode}`);
                    const sourcesData: { sources: any[] } = await sourcesRes.json();
                    const sources = sourcesData.sources ?? [];
                    setPendingTasks((p) => p + sources.length - 1); // -1 because we already have one pending for the initial fetch
                    setPendingTasksMax((p) => p + sources.length - 1);
                    for (const source of sources.filter((s: any) => s.url&&s.id)) {
                        (async (source) => {
                            try {
                                const res = await fetch(`/api/xpass-wrap?type=${type}&id=${id}&season=${season}&episode=${episode}&source=${source.id}`);
                                const data = await res.json();
                                const streams = (data ?? []).map((s: any) => ({
                                    label: `XPass ${source.name} ${s.label}`,
                                    type: s.type,
                                    url: s.file,
                                    uuid: randomUUID(),
                                }));
                                const validStreams = (await Promise.all(
                                    streams.map(async (s: any) => (await validateStream(s) ? s : null))
                                )).filter(Boolean) as typeof streams;
                                commitResults(validStreams, [], { from: "xpass-" + source.name, data });
                                setPendingTasks((p) => p - 1);
                            } catch (error) {
                                console.error(`Error fetching XPass source ${source.name}:`, error);
                            }
                        })(source);
                    }
                } catch (error) {
                    console.error("Error fetching XPass data:", error);
                }
            })(),

            // 123Anime
            (async () => {
                try {
                    const response = await fetch(`/api/123anime-wrap?id=${playerData!.id}&s=${playerData!.season ?? ""}&e=${playerData!.episode ?? ""}`);
                    const data = await response.json();
                    // Process 123Anime data: {sources: {label: string, m3u8: string}[]}}
                    const streams = (data.sources ?? []).map((s: any) => ({
                        label: `123Anime ${s.label}`,
                        type: "hls",
                        url: s.m3u8,
                        uuid: randomUUID(),
                    }));
                    const validStreams = (await Promise.all(
                        streams.map(async (s: any) => (await validateStream(s) ? s : null))
                    )).filter(Boolean) as typeof streams;
                    commitResults(validStreams, [], { from: "123anime", data });
                } catch (error) {
                    console.error("Error fetching 123Anime data:", error);
                }
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
                        const url = (s.requires_proxy && (s.proxy_mode === 'full'))
                            ? `https://api.anyembed.xyz` + await api.genProxyURL(s.url, s.headers)
                            : s.url;
                        const format = (url.includes(".m3u8") ? "hls" : "mp4");
                        streams.push({ label: `AnyEmbed ${format} ${s.quality} ${btoa(url).substr(0, 5)}`, type: format, url, uuid: randomUUID(), qs: s.quality_score });
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
                const validStreams = (await Promise.all(
                    streams.map(async s => (await validateStream(s) ? s : null))
                )).filter(Boolean).sort((a: any, b: any) => (b.qs ?? 0) - (a.qs ?? 0)) as typeof streams;
                commitResults(validStreams, captions, { from: "anyembed", data: ae });
                setPendingTasks((p) => p - 1);
                // since AE usually has good streams,
                if (validStreams.length > 0 && videoLoading) {
                    setCurrentStream(validStreams[0]);
                }
            })(),
        ].map(task =>
            task.finally(() => setPendingTasks((p: number) => p - 1))
        );;

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

    const [showControlsTimeout, setShowControlsTimeout] = useState<NodeJS.Timeout | null>(null);

    const videoProps: React.VideoHTMLAttributes<HTMLVideoElement> = {
        controls: false,
        autoPlay: true,
        style: { maxWidth: "100%", maxHeight: "100%", objectFit: 'contain', height: '100vh', width: '100%' },
        className: "mvs-player-content",
        onClick: playPause,
        onMouseMove: () => {
            setShowControls(true);
            if (showControlsTimeout) {
                clearTimeout(showControlsTimeout);
            }
            setShowControlsTimeout(setTimeout(() => {
                setShowControls(false);
            }, 3000));
        },
        onTimeUpdate: (e) => {
            setCurrentTime(e.currentTarget.currentTime);
            setDuration(e.currentTarget.duration);
            setVideoIsPaused(e.currentTarget.paused);
            setVideoLoading(false);
        },
        onLoadedMetadata: (e) => {
            setDuration(e.currentTarget.duration);
            setVideoLoading(false);
        },
        // fail load
        onError: () => {
            if (!manualServer) {
                let nextStreamIndex = allStreams.findIndex(s => s.uuid === currentStream?.uuid) + 1;
                if (nextStreamIndex < allStreams.length) {
                    setCurrentStream(allStreams[nextStreamIndex]);
                    setVideoLoading(true);
                }
            } else {
                // maybe display warning icon instead of loading
            }
        },
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

    const [manualServer, setManualServer] = useState(false);

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
        //,/. (</>) for frame back/forward
        if (e.code === "Comma" || e.code === "Period") {
            e.preventDefault();
            const video = videoRef.current;
            if (video) {
                video.currentTime += e.code === "Comma" ? -0.04 : 0.04;
                setCurrentTime(video.currentTime);
            }
        }
    }


    // have an activeDownload that stores the uuid of the stream thats downloading, the progress/maxProgress, and whether it's done. then in the server select, show a download button for each stream that isn't the current one, and when clicked, set the activeDownload to that stream, and start downloading it, updating progress as it goes, and when done, open the url in a new tab.
    const [activeDownload, setActiveDownload] = useState<{ uuid: string; downloader: HLSDownloader } | null>(null);

    function startDownload(stream: { label: string; type: string; url: string; uuid: string }) {
        if (activeDownload) return; // only one at a time for simplicity

        if(stream.type !== "hls") {
            // for direct mp4 links, just open the url in a new tab
            const a = document.createElement("a");
            a.href = stream.url;
            a.download = `${(
                tmdbData ? (playerData?.type === "movie" ? (tmdbData as TMDBMovie)?.title : (tmdbData as TMDBShow)?.name) : "media"
            ) || "video"}_${stream.label}_${stream.type}-Movieslay.mp4`;
            document.body.appendChild(a);
            a.click();
            a.remove();
            return;
        }

        const downloader = new HLSDownloader(stream.url, (progress) => { }, (blob) => {
            setActiveDownload(null);
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = `${(
                tmdbData ? (playerData?.type === "movie" ? (tmdbData as TMDBMovie)?.title : (tmdbData as TMDBShow)?.name) : "media"
            ) || "video"}_${stream.label}_${stream.type}-Movieslay.mp4`;
            document.body.appendChild(a);
            a.click();
            a.remove();
        }, (err) => {
            setActiveDownload(null);
            console.error("Download failed:", err);
            alert("Download failed: " + err);
        });
        setActiveDownload({ uuid: stream.uuid, downloader: downloader });
        downloader.start();
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
                        <div style={{
                            position: "absolute", bottom: "0", left: "0", height: "50px", display: `${showControls ? "flex" : "none"
                                }`, flexDirection: 'column', width: "calc(100% - 20px)", marginLeft: '10px', background: "linear-gradient(transparent, rgba(0,0,0,0.7))"
                        }}>
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
                                step={0.1}
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
                                                            setManualServer(true);
                                                        }}
                                                        sx={{
                                                            position: "relative",
                                                        }}
                                                    >
                                                        <ListItemButton selected={currentStream?.uuid === stream.uuid} sx={{
                                                            // cap text to 1 line with ellipsis
                                                            whiteSpace: "nowrap",
                                                            overflow: "hidden",
                                                            textOverflow: "ellipsis",
                                                            width: "100%",
                                                        }}>
                                                            <i className={`fas fa-${stream.type === "hls" ? "stream" : "file-video"}`} style={{ marginRight: "8px" }}></i>
                                                            <span style={{
                                                                whiteSpace: "nowrap",
                                                                overflow: "hidden",
                                                                textOverflow: "ellipsis",
                                                                width: "100%",
                                                            }}>{stream.label}</span>
                                                        </ListItemButton>
                                                        <Button variant="outlined" color={"neutral"} size="sm" onClick={(e) => {
                                                            if (activeDownload) {
                                                                if(activeDownload.uuid === stream.uuid) {
                                                                    activeDownload.downloader.cancel();
                                                                    e.stopPropagation();
                                                                    return;
                                                                }
                                                                alert("Another download is in progress. Please wait.");
                                                                e.stopPropagation();
                                                                return;
                                                            }
                                                            startDownload(stream);
                                                            e.stopPropagation();
                                                        }} style={{ marginLeft: "8px" }} disabled={!!activeDownload && activeDownload.uuid !== stream.uuid}
                                                            sx={activeDownload?.uuid === stream.uuid ? {
                                                                '&:hover': {
                                                                    bgcolor: 'danger.softBg',
                                                                    color: 'danger.plainColor',
                                                                },
                                                            } : {}}>
                                                            {activeDownload?.uuid === stream.uuid ? <CircularProgress size="sm" determinate value={activeDownload?.downloader?.progress || 0} style={{ marginRight: "0px", scale: 1 }}>
                                                                {activeDownload.downloader.progress.toFixed(1)}
                                                            </CircularProgress> : <i className="fas fa-download"></i>}
                                                        </Button>
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
                                                {allCaptions/*.sort((a, b) => (a.type === 'vtt' ? -1 : 1))*/.map((caption) => (
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
                {allFinalDatas.length > 0 && allStreams.length === 0 && (pendingTasks > 0 ? <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <img src="/assets/mvs_watermark.png" style={{ width: '200px', margin: '0 auto' }} />
                    <p style={{ color: 'white' }}>Loading ({pendingTasksMax - pendingTasks}/{pendingTasksMax})...</p>
                </div> : <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <img src="/assets/mvs_watermark.png" style={{ width: '200px', margin: '0 auto' }} />
                    <p style={{ color: "#aaa" }}>No playable stream found.
                        <br />Switch services via the <i className="fas fa-dice-one"></i><i className="fas fa-dice-two"></i><i className="fas fa-dice-three"></i> buttons</p>
                </div>)}
                {error && <p style={{ color: "red" }}>{error}</p>}
            </div>
        </CssVarsProvider>
    );
}