"use client";
import { useEffect, useState, useRef } from "react";
import { makeProviders, makeStandardFetcher, RunOutput, ScrapeMedia, targets, HlsBasedStream, FileBasedStream, StreamFile, Qualities, Stream } from "@movie-web/providers";
import Hls from "hls.js";
import { useSearchParams } from "next/navigation";
import { iframe } from "framer-motion/client";
import "./player.css";
export declare type RealRunOutput = {
    sourceId?: string;
    embedId?: string;
    stream: Stream[];
    embeds: { embedId: string, url: string }[];
};
export default function PlayerPage() {
    const [output, setOutput] = useState<{
        output: Record<string, RealRunOutput>;
        found: Record<string, boolean>;
    } | null>(null);
    const [error, setError] = useState<string | null>(null);
    const videoRef = useRef<HTMLVideoElement>(null);
    const hlsInstanceRef = useRef<Hls | null>(null);
    const searchParams = useSearchParams();
    const [source, setSource] = useState<string>(searchParams.get("source") || 'flixhq');
    const [title,] = useState<string>(searchParams.get("title") || 'A Minecraft Movie');
    const [tmdbId,] = useState<string>(searchParams.get("tmdb") || '950387');
    const [releaseYear,] = useState<string>(searchParams.get("year") || '2025');
    const [episodeNumber,] = useState<string>(searchParams.get("episode") || '1');
    const [seasonNumber,] = useState<string>(searchParams.get("season") || '1');

    function firstSourceWithStream(output: any) {
        for (const source in output.output) {
            const stream = output.output[source].stream;
            if (stream && stream.length > 0) {
                const hasFileStream = stream.some((s:any) => s.type === 'file');
                if (hasFileStream) {
                    return source;
                }
            }
        }
        for (const source in output.output) {
            const stream = output.output[source].stream;
            if (stream && stream.length > 0) {
                return source;
            }
        }
        return null;
    }
    useEffect(() => {
        const fetchStream = async () => {
            fetch("/api/sources", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    media: {
                        tmdbId: tmdbId,
                        title: title,
                        releaseYear: parseInt(releaseYear),
                        type: (episodeNumber && seasonNumber) ? "show" : "movie",
                        episode: {
                            number: parseInt(episodeNumber),
                            tmdbId: tmdbId,
                        },
                        season: {
                            number: parseInt(seasonNumber),
                            tmdbId: tmdbId,
                        }
                    }
                })
            }).then((res) => res.json())
                .then((data) => {
                    if (data.error) {
                        setError(data.error);
                    } else {
                        if (!data.output[source] || (data.output[source] && !data.output[source].stream)) {
                            const firstSource = firstSourceWithStream(data);
                            if (firstSource) {
                                setSource(firstSource);
                            } else {
                                setSource(Object.keys(data.output)[0]);
                            }
                        }
                        console.log("Fetched stream data:", data);
                        setOutput(data);
                    }
                }).catch((err) => {
                    console.error("Error fetching stream:", err);
                    setError("Failed to fetch stream");
                });
        }
        fetchStream();
    }, []);

    useEffect(() => {
        if (output?.output[source].stream && output?.output[source].stream[0]?.type === "hls" && videoRef.current) {
            if (hlsInstanceRef.current) {
                hlsInstanceRef.current.destroy();
            }

            if (Hls.isSupported()) {
                const hls = new Hls();
                hlsInstanceRef.current = hls;

                hls.loadSource((output?.output[source].stream[0] as HlsBasedStream).playlist);
                hls.attachMedia(videoRef.current);
            } else if (videoRef.current.canPlayType('application/vnd.apple.mpegurl')) {
                videoRef.current.src = (output?.output[source].stream[0] as HlsBasedStream).playlist;
            } else {
                setError("HLS playback not supported in your browser");
            }
        }
        return () => {
            if (hlsInstanceRef.current) {
                hlsInstanceRef.current.destroy();
                hlsInstanceRef.current = null;
            }
        };
    }, [output]);

    function getFileURL() {
        if (output?.output[source].stream && output?.output[source].stream[0].type === 'file') {
            const fileStream = output?.output[source].stream[0] as FileBasedStream;
            const qualities = Object.keys(fileStream.qualities) as Qualities[];
            for (const quality of qualities) {
                const stream = fileStream.qualities[quality] as StreamFile;
                if (stream) {
                    return stream.url;
                }
            }
        }
        return undefined;
    }

    return (
        <main>
            {error && <div style={{ color: "red" }}>Error: {error}</div>}
            {!output && !error && <div>Loading stream...</div>}
            {(output?.output[source].stream && output?.output[source].stream[0].type === 'file') && (<>
                <video
                    controls
                    src={getFileURL()}
                />
            </>)}
            {(output?.output[source].stream && output?.output[source].stream[0].type === 'hls') && (<>
                <video
                    ref={videoRef}
                    controls
                />
            </>)}
            {output && !output?.output[source].stream && (
                <div>No stream found for this movie.</div>
            )}
        </main>
    );
}