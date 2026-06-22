import { NextRequest, NextResponse } from "next/server";
import getAnimeMap from "./map";

export async function GET(req: NextRequest) {
    const tmdbId = req.nextUrl.searchParams.get("tmdbId");

    if (!tmdbId) {
        return NextResponse.json({
            error: "no tmdb id specified with ?tmdbId"
        }, { status: 400 });
    }

    try {
        const results = await getAnimeMap(tmdbId);
        return NextResponse.json(results);
    } catch(ex) {
        return NextResponse.json({
            error: "internal error"
        }, { status: 500 });
    }
}