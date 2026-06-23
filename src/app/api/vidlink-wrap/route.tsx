import { NextRequest, NextResponse } from "next/server";

const HEADERS = {
  "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0.0.0 Safari/537.36",
  Origin: "https://vidlink.pro",
  Referer: "https://vidlink.pro/",
};

const ENC_DEC_API = "https://enc-dec.app/api";
const VIDLINK_API = "https://vidlink.pro/api/b";

interface EncDecResponse {
  status: number;
  result?: string;
  error?: string;
}

function validate(data: EncDecResponse, path: string): string {
  if (data.status !== 200) {
    throw new Error(
      `API error at ${path} — status ${data.status}: ${data.error ?? "unknown"}`
    );
  }
  if (!data.result) {
    throw new Error(`API returned no result at ${path}`);
  }
  return data.result;
}

export async function GET(req: NextRequest) {
  const tmdbId = req.nextUrl.searchParams.get("tmdbId");
  const season = req.nextUrl.searchParams.get("s");
  const episode = req.nextUrl.searchParams.get("e");

  if (!tmdbId) {
    return NextResponse.json(
      { error: "Missing required parameter: tmdbId" },
      { status: 400 }
    );
  }

  const isTV = season !== null && episode !== null;

  if (season !== null && episode === null) {
    return NextResponse.json(
      { error: "Parameter 's' (season) requires 'e' (episode)" },
      { status: 400 }
    );
  }
  if (episode !== null && season === null) {
    return NextResponse.json(
      { error: "Parameter 'e' (episode) requires 's' (season)" },
      { status: 400 }
    );
  }

  try {
    const encUrl = `${ENC_DEC_API}/enc-vidlink?text=${encodeURIComponent(tmdbId)}`;
    const encRes = await fetch(encUrl);

    if (!encRes.ok) {
      return NextResponse.json(
        { error: `Encryption service returned HTTP ${encRes.status}` },
        { status: 502 }
      );
    }

    const encData: EncDecResponse = await encRes.json();
    const encrypted = validate(encData, encUrl);

    const vidlinkUrl = isTV
      ? `${VIDLINK_API}/tv/${encrypted}/${season}/${episode}`
      : `${VIDLINK_API}/movie/${encrypted}`;

    const vidRes = await fetch(vidlinkUrl, { headers: HEADERS });

    if (!vidRes.ok) {
      return NextResponse.json(
        { error: `Vidlink returned HTTP ${vidRes.status}` },
        { status: 502 }
      );
    }

    const vidData = await vidRes.json();

    return NextResponse.json(vidData);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unexpected error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}