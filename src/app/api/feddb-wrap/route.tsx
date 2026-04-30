import { NextResponse } from 'next/server';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const name = searchParams.get("name");
    const year = searchParams.get("year");
    const season = searchParams.get("season");
    const episode = searchParams.get("episode");

    if (!name) {
        return NextResponse.json({ error: "Missing 'name' parameter" }, { status: 400 });
    }

    const url = new URL("https://mznxiwqjdiq00239q.space/fedapi");
    url.searchParams.set("name", name);
    if (year) url.searchParams.set("year", String(year));
    url.searchParams.set("ui", process.env.FEDDB || "");

    if (season) url.searchParams.set("season", String(season));
    if (episode) url.searchParams.set("episode", String(episode));

    try {
        const res = await fetch(url.toString());
        if (!res.ok) {
            console.error(`Failed to fetch from Febbox: ${res.status}`);
            return NextResponse.json({ error: "Failed to fetch from Febbox" }, { status: 502 });
        }
        const data = await res.json();
        return NextResponse.json(data);
    } catch (err) {
        console.error("Error fetching from Febbox:", err);
        return NextResponse.json({ error: "Error fetching from Febbox" }, { status: 502 });
    }
}