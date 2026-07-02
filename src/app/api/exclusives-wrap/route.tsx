import { NextRequest, NextResponse } from "next/server";

const internalMap = {
    "1083381": [
        {
            url: "https://www.dropbox.com/scl/fi/7o9qiaoofnaxfk9z98mev/backrooms-internal-480p.mp4?rlkey=vxliv6ci0v83iawdnajgjo9sd&st=d4b4399i&dl=0&raw=1",
            quality: "480p",
            type: "mp4",
            label: "iNTERNAL by Movieslay",
            ogUrl: "https://movieslay.com/exclusives/backrooms",
        }
    ]
} as Record<string, { url: string; quality?: string; type: string; label: string, ogUrl?: string }[]>;

export async function GET(req: NextRequest) {
    const id = req.nextUrl.searchParams.get("id");
    if (!id) {
        return NextResponse.json({ error: "no ?id provided, use tmdb ID", sources: [] }, { status: 400 });
    }
    if (!internalMap[id]) {
        return NextResponse.json({ error: "content not held", sources: [] }, { status: 400 });
    }

    return NextResponse.json({ sources: internalMap[id] });
}