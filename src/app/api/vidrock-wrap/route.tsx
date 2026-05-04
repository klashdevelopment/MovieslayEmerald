import { NextRequest, NextResponse } from "next/server";
import CryptoJS from "crypto-js";

const SECRET = "x7k9mPqT2rWvY8zA5bC3nF6hJ2lK4mN9";
const BASE_URL = "https://vidrock.net/api";
const SUB_URL = "https://sub.vdrk.site/v1";

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
  
  const subs = [];
  // https://sub.vdrk.site/v1/movie/533535
  // https://sub.vdrk.site/v1/tv/94997/1/1
  try {
    const subUrl = `${SUB_URL}/${type}/${tmdb}${type === "tv" ? `/${season}/${episode}` : ""}`;
    const subResponse = await fetch(subUrl);
    if (subResponse.ok) {
      const subData = await subResponse.json();
      if (Array.isArray(subData)) {
        subs.push(...subData);
      }
    }
  } catch (e) {
    console.error("Failed to fetch subtitles:", e);
  }

  return NextResponse.json({ hls, mp4, subs }, { status: upstream.status });
}