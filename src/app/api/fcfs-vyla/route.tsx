import { NextResponse } from 'next/server';
import { GET as getVylaWrap } from '../vyla-wrap/route';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') || 'tv';

    try {
        const baseUrl = new URL(request.url).origin;
        const sourcesResponse = await getVylaWrap(new Request(`${baseUrl}/api/vyla-wrap?sources=true`));
        if (!sourcesResponse.ok) {
            throw new Error(`Error fetching sources: ${sourcesResponse.statusText}`);
        }
        const { sources } = await sourcesResponse.json();

        const result = await Promise.any(
            sources.map(async (source: string) => {
                const url = `${baseUrl}/api/vyla-wrap?type=${type}&source=${source}&id=${searchParams.get('id')}&s=${searchParams.get('s')}&e=${searchParams.get('e')}`;
                const response = await getVylaWrap(new Request(url));
                if (!response.ok) throw new Error(`Bad response from ${source}`);
                const data = await response.json();
                if (!data.ok || !data.url) throw new Error(`No result from ${source}`);
                return { source, data };
            })
        );

        return NextResponse.json(result);
    } catch (error: any) {
        if (error instanceof AggregateError) {
            return NextResponse.json({ error: 'No sources returned results' }, { status: 404 });
        }
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}