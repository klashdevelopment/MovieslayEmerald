//https://vyla-player.pages.dev/api?sources=1&id=129412&s=7&e=1
import { NextResponse } from "next/server";

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    const s = searchParams.get("s");
    const e = searchParams.get("e");
    const type = searchParams.get("type") || "tv";

    if (!id || (type === "tv" && (!s || !e))) {
        return NextResponse.json({ error: "Missing parameters" }, { status: 400 });
    }

    const url = type === "movie"
        ? `https://missourimonster-vyla-api.hf.space/api/movie?id=${id}`
        : `https://missourimonster-vyla-api.hf.space/api/tv?id=${id}&season=${s}&episode=${e}`;
    try {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`Error fetching data: ${response.statusText}`);
        }
        const data = await response.json();
        return NextResponse.json(data);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}