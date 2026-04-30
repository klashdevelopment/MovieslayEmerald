import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Head from "next/head";

const inter = Inter({
    subsets: ["latin"],
})

export const metadata: Metadata = {
    title: "Movieslay (Emerald)",
    description: "Movieslay Emerald - The successor to Movieslay, a free streaming platform.",
    icons: [
        {
            rel: "icon",
            url: "/favicon.ico",
        }
    ]
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="en">
            <head>
                <script src="https://challenges.cloudflare.com/turnstile/v0/api.js" async></script>
            </head>
            <body className={`${inter.className}`}>
                {children}
            </body>
        </html>
    );
}
