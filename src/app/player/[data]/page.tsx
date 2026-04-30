"use client";

import { useEffect, useState } from "react";

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

    useEffect(() => {
        params.then(({ data }) => {
            try {
                const decoded = JSON.parse(atob(data)) as PlayerData;
                setPlayerData(decoded);
            } catch (e) {
                console.error("Failed to decode player data:", e);
            }
        });
    })

    return (
        <div>
            <h1>Player</h1>
            <pre>{JSON.stringify(playerData, null, 2)}</pre>
        </div>
    );
}