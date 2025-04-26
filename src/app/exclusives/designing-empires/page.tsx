import PageLayout, { useIsDesktop } from "@/app/components/PageLayout";
import { useEffect, useState } from "react";
import Controls from "@/app/components/controls";
import useRecentlyWatched from "@/app/data/RecentlyWatched";
import exclusives, { Exclusive } from "@/app/components/Exclusives";
import Head from "next/head";
import { Metadata } from "next";
import DEPage from "./mvp";

const movie: Exclusive = exclusives.find((e) => e.id === 'designing-empires')!;

export const metadata: Metadata = {
    title: `${movie.title} - Movieslay`,
    description: movie.description,
    openGraph: {
        title: `${movie.title} - Movieslay`,
        description: movie.description,
        images: [
            {
                url: movie.image,
                width: 800,
                height: 600
            }
        ]
    },
    twitter: {
        card: 'summary_large_image',
        title: `${movie.title} - Movieslay`,
        description: movie.description,
        images: [movie.image]
    }
};

export default function MoviePage() {
    return (
        <DEPage movie={movie} />
    );
}