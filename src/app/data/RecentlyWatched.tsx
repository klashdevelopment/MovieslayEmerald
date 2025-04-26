import { useState, useEffect } from "react";

export interface RecentMedia {
    type: 'movie' | 'series' | 'exclusive';
    title: string;
    thumbnail: string;
    id: string|number;
    series?: {
        season: number;
        episode: number;
    }
}

// take recentlyWatched from localstorage, return recentlyWatched, addMedia, updateMediaByID
export default function useRecentlyWatched() {
    const [recentlyWatched, setRecentlyWatched] = useState<RecentMedia[]>([]);
    
    // Move localStorage operations to useEffect to ensure they run only in browser
    useEffect(() => {
        try {
            const storedData = localStorage.getItem('recentlyWatched');
            if (!storedData) {
                const defaultValue: RecentMedia[] = [];
                localStorage.setItem('recentlyWatched', JSON.stringify(defaultValue));
                setRecentlyWatched(defaultValue);
            } else {
                setRecentlyWatched(JSON.parse(storedData));
            }
        } catch (error) {
            console.error('Error accessing localStorage:', error);
        }
    }, []);

    function addMedia(media: RecentMedia) {
        if (media.type === 'movie') {
            setRecentlyWatched((prev: RecentMedia[]) => {
                const newList = prev.filter((m) => m.id !== media.id);
                try {
                    localStorage.setItem('recentlyWatched', JSON.stringify(newList));
                } catch (error) {
                    console.error('Error saving to localStorage:', error);
                }
                return newList;
            });
        }
        setRecentlyWatched((prev: RecentMedia[]) => {
            const newList = [...prev, media];
            try {
                localStorage.setItem('recentlyWatched', JSON.stringify(newList));
            } catch (error) {
                console.error('Error saving to localStorage:', error);
            }
            return newList;
        });
    }

    function updateMediaByID(id: string, media: RecentMedia) {
        setRecentlyWatched((prev: RecentMedia[]) => {
            const newList = prev.map((m) => m.id === id ? media : m);
            try {
                localStorage.setItem('recentlyWatched', JSON.stringify(newList));
            } catch (error) {
                console.error('Error saving to localStorage:', error);
            }
            return newList;
        });
    }

    function addOrUpdateSeries(media: RecentMedia) {
        // if not a series, return
        if (media.type !== 'series') return;
        // if media.id is not in recentlyWatched, add it
        if (!recentlyWatched.find((m) => m.id === media.id)) {
            addMedia(media);
            return;
        }
        // if media.id is in recentlyWatched, update it
        setRecentlyWatched((prev: RecentMedia[]) => {
            const newList = prev.map((m) => m.id === media.id ? media : m);
            try {
                localStorage.setItem('recentlyWatched', JSON.stringify(newList));
            } catch (error) {
                console.error('Error saving to localStorage:', error);
            }
            return newList;
        });
    }

    return { recentlyWatched, addMedia, updateMediaByID, addOrUpdateSeries };
}