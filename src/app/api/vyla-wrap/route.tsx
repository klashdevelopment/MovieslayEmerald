import { NextResponse } from "next/server";
import { getVyla, getVylaSources } from "./routes";

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);

    if (searchParams.get('sources') === 'true') {
        try {
            const sources = await getVylaSources();
            return NextResponse.json({ sources });
        } catch (error: any) {
            return NextResponse.json({ error: error.message }, { status: 500 });
        }
    }

    const id = searchParams.get("id");
    const s = searchParams.get("s");
    const e = searchParams.get("e");
    const type = (searchParams.get("type") as "movie" | "tv") || "tv";
    const source = searchParams.get("source");
    const timeout = searchParams.get("timeout");

    try {
        const data = await getVyla(id as string, type, s, e, source, timeout);
        return NextResponse.json(data);
    } catch (error: any) {
        const msg = error.message === 'Missing parameters' ? 'Missing parameters' : error.message;
        const status = error.message === 'Missing parameters' ? 400 : 500;
        return NextResponse.json({ error: msg }, { status });
    }
}