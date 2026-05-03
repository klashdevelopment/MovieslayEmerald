import { NextRequest } from 'next/server';

async function getTargetUrl(req: Request | NextRequest): Promise<string | null> {
    const url = new URL(req.url);
    const param = url.searchParams.get('url') || url.searchParams.get('target');
    if (param) return param;

    // Try JSON body for POST-like requests
    try {
        if (req instanceof Request) {
            const contentType = req.headers.get('content-type') || '';
            if (contentType.includes('application/json')) {
                const json = await req.clone().json();
                if (json?.url) return json.url;
            } else if (contentType.includes('application/x-www-form-urlencoded')) {
                const form = await req.clone().text();
                const params = new URLSearchParams(form);
                if (params.get('url')) return params.get('url');
            }
        }
    } catch {
        // ignore parse errors
    }

    return null;
}

function copyHeadersExcept(input: Headers, exclude: string[] = []) {
    const out = new Headers();
    for (const [k, v] of input.entries()) {
        if (!exclude.includes(k.toLowerCase())) out.set(k, v);
    }
    return out;
}

export async function GET(request: Request) {
    const target = await getTargetUrl(request);
    if (!target || !/^https?:\/\//i.test(target)) {
        return new Response('Missing or invalid "url" query param', { status: 400 });
    }

    // forward incoming headers except host
    const forwardHeaders = copyHeadersExcept(request.headers, ['host']);

    const resp = await fetch(target, {
        method: 'GET',
        headers: forwardHeaders,
        redirect: 'manual',
    });

    // Return proxied response, preserving status and headers
    const respHeaders = copyHeadersExcept(resp.headers, [
        // hop-by-hop headers to avoid problems
        'connection',
        'keep-alive',
        'proxy-authenticate',
        'proxy-authorization',
        'te',
        'trailers',
        'transfer-encoding',
        'upgrade',
    ]);

    return new Response(resp.body, { status: resp.status, headers: respHeaders });
}

export async function POST(request: Request) {
    const target = await getTargetUrl(request);
    if (!target || !/^https?:\/\//i.test(target)) {
        return new Response('Missing or invalid "url" (query param or JSON body)', { status: 400 });
    }

    // forward incoming headers except host and content-length (fetch sets it)
    const forwardHeaders = copyHeadersExcept(request.headers, ['host', 'content-length']);

    const body = await request.arrayBuffer().catch(() => undefined);

    const resp = await fetch(target, {
        method: 'POST',
        headers: forwardHeaders,
        body,
        redirect: 'manual',
    });

    const respHeaders = copyHeadersExcept(resp.headers, [
        'connection',
        'keep-alive',
        'proxy-authenticate',
        'proxy-authorization',
        'te',
        'trailers',
        'transfer-encoding',
        'upgrade',
    ]);

    return new Response(resp.body, { status: resp.status, headers: respHeaders });
}