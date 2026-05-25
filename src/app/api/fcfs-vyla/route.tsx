import { NextResponse } from 'next/server';
import { getVyla, getVylaSources } from '../vyla-wrap/routes';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const type = (searchParams.get('type') || 'tv') as "movie" | "tv";

    // tmdb
    const id = searchParams.get('id');
    if(!id) {
        return NextResponse.json({ error: 'Missing id parameter' }, { status: 400 });
    }
    const s = searchParams.get('s');
    const e = searchParams.get('e');
    if(type === 'tv' && (!s || !e)) {
        return NextResponse.json({ error: 'Missing season and episode parameter for tv' }, { status: 400 });
    }

    try {
        const sourcesRaw: any = await getVylaSources();
        console.log(sourcesRaw);

        const sources = sourcesRaw.filter((source: string) => source !== 'fireflix');

        // For each source, fetch the vyla data for that source. Do this for ALL sources, at once, and return the first result that has a response.data.url.
        const sourceDataPromises = sources.map((source: string) => getVyla(id, type, s, e, source).then(data => ({ source, data })).catch(() => null));
        const sourceDataResults = await Promise.allSettled(sourceDataPromises);
        
        for (const result of sourceDataResults) {
            if (result.status === 'fulfilled' && result.value && result.value.data && result.value.data.url) {
                return NextResponse.json({ source: result.value.source, data: result.value.data });
            }
        }
        throw new Error('No valid sources found');
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}