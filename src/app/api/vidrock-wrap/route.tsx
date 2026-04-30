import { NextRequest, NextResponse } from "next/server";
import CryptoJS from "crypto-js";

const SECRET = "x7k9mPqT2rWvY8zA5bC3nF6hJ2lK4mN9";
const BASE_URL = "https://vidrock.net/api";

function encryptMediaId(tmdb: string, type: "movie" | "tv", season = "1", episode = "1"): string {
  const input = type === "tv" ? `${tmdb}_${season}_${episode}` : tmdb;
  const key = CryptoJS.enc.Utf8.parse(SECRET);
  const iv = CryptoJS.enc.Utf8.parse(SECRET.substring(0, 16));

  let encrypted = CryptoJS.AES.encrypt(input, key, { iv }).ciphertext.toString(CryptoJS.enc.Base64);
  return encrypted.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

type RawSource = { url: string | null; language: string | null; flag: string | null; type: string | null };
type Mp4Entry = { type: "mp4"; url: string };
type HlsEntry = { type: "hls"; url: string };

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const tmdb = searchParams.get("tmdb");
  const type = (searchParams.get("type") ?? "movie") as "movie" | "tv";
  const season = searchParams.get("s") ?? "1";
  const episode = searchParams.get("e") ?? "1";

  if (!tmdb) return NextResponse.json({ error: "tmdb is required" }, { status: 400 });

  const encrypted = encryptMediaId(tmdb, type, season, episode);
  const upstream = await fetch(`${BASE_URL}/${type === "tv" ? "tv" : "movie"}/${encodeURIComponent(encrypted)}`);
  const raw: Record<string, RawSource> = await upstream.json();

  let hls: HlsEntry[] = [];
  const mp4: Record<number, Mp4Entry> = {};

  await Promise.all(
    Object.values(raw).map(async (source) => {
      if (!source.url) return;

      if (source.type === "hls") {
        hls.push({ type: "hls", url: source.url });
      } else if (source.type === "mp4") {
        const playlist = await fetch(source.url).then((r) => r.json()) as { resolution: number; url: string }[];
        for (const { resolution, url } of playlist) {
          // highest-quality source wins if there's a resolution collision
          if (!mp4[resolution]) mp4[resolution] = { type: "mp4", url };
        }
      }
    })
  );

//   hls = hls.reverse();

  return NextResponse.json({ hls, mp4 }, { status: upstream.status });
}