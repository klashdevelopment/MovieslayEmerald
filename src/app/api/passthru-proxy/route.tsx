import { NextRequest, NextResponse } from 'next/server';

function rewriteM3U8(content: string, proxyBase: string, originalUrl: string, extraParams: string): string {
    const base = new URL(originalUrl);
    const baseDir = base.href.substring(0, base.href.lastIndexOf('/') + 1);

    return content
        .split('\n')
        .map(line => {
            const trimmed = line.trim();

            // Skip comments and empty lines
            if (!trimmed || trimmed.startsWith('#')) {
                // Rewrite URIs inside EXT-X-MAP, EXT-X-KEY, etc.
                return line.replace(/URI="([^"]+)"/g, (_, uri) => {
                    const absolute = resolveUrl(uri, baseDir, base.origin);
                    return `URI="${proxyBase}${encodeURIComponent(absolute)}${extraParams}"`;
                });
            }

            // Rewrite segment/playlist URLs
            const absolute = resolveUrl(trimmed, baseDir, base.origin);
            return `${proxyBase}${encodeURIComponent(absolute)}${extraParams}`;
        })
        .join('\n');
}

function resolveUrl(uri: string, baseDir: string, origin: string): string {
    if (uri.startsWith('http://') || uri.startsWith('https://')) {
        return uri;
    }
    if (uri.startsWith('/')) {
        return `${origin}${uri}`;
    }
    return `${baseDir}${uri}`;
}

async function handler(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const targetUrl = searchParams.get('url');
        const headersParam = searchParams.get('headers');
        const origin = searchParams.get('Origin');
        const referer = searchParams.get('Referer');

        if (!targetUrl) {
            return NextResponse.json(
                { error: 'Missing url parameter' },
                { status: 400 }
            );
        }

        const headers: Record<string, string> = {};

        if (headersParam) {
            try {
                Object.assign(headers, JSON.parse(headersParam));
            } catch {
                return NextResponse.json(
                    { error: 'Invalid headers JSON' },
                    { status: 400 }
                );
            }
        }

        if (origin) headers['Origin'] = origin;
        if (referer) headers['Referer'] = referer;
        const cookie = req.headers.get('cookie');
        const ua = req.headers.get('user-agent');
        if (cookie) headers['Cookie'] = cookie;
        if (ua) headers['User-Agent'] = ua;

        // Pass through Range header for video seeking support
        const rangeHeader = req.headers.get('range');
        if (rangeHeader) {
            headers['Range'] = rangeHeader;
        }

        const body = req.method !== 'GET' && req.method !== 'HEAD'
            ? await req.text()
            : undefined;

        const response = await fetch(targetUrl, {
            method: req.method,
            headers,
            body,
        });
        const reader = response.body!.getReader();
        const { value: firstChunk } = await reader.read();
        const firstBytes = firstChunk ? new TextDecoder().decode(firstChunk) : '';

        const contentType = response.headers.get('Content-Type') || 'application/octet-stream';
        const isM3U8 = firstBytes.trimStart().startsWith('#EXTM3U')
            || contentType.includes('application/vnd.apple.mpegurl')
            || contentType.includes('application/x-mpegurl')
            || targetUrl.includes('.m3u8');

        if (isM3U8) {
            let text = firstBytes;
            while (true) {
                const { done, value } = await reader.read();
                if (done) break;
                text += new TextDecoder().decode(value);
            }

            // Reconstruct extra params (headers, Origin, Referer) to forward on rewritten URLs
            const extraParams = new URLSearchParams();
            if (headersParam) extraParams.set('headers', headersParam);
            if (origin) extraParams.set('Origin', origin);
            if (referer) extraParams.set('Referer', referer);
            const extraParamsStr = extraParams.size > 0 ? `&${extraParams.toString()}` : '';

            // Build the proxy base URL from the incoming request
            const reqUrl = req.nextUrl;
            const proxyBase = `${reqUrl.origin}${reqUrl.pathname}?url=`;

            const rewritten = rewriteM3U8(text, proxyBase, targetUrl, extraParamsStr);

            return new NextResponse(rewritten, {
                status: response.status,
                headers: {
                    'Content-Type': 'application/vnd.apple.mpegurl',
                    'Access-Control-Allow-Origin': '*',
                },
            });
        } else {
            // Re-stream: stitch firstChunk back onto the rest
            const stream = new ReadableStream({
                start(controller) {
                    if (firstChunk) controller.enqueue(firstChunk);
                },
                async pull(controller) {
                    const { done, value } = await reader.read();
                    if (done) controller.close();
                    else controller.enqueue(value);
                },
            });


            // For video/binary content, stream with full header passthrough
            const responseHeaders: Record<string, string> = {
                'Content-Type': contentType,
                'Access-Control-Allow-Origin': '*',
            };

            // Forward range-related headers for seeking
            const contentRange = response.headers.get('content-range');
            const contentLength = response.headers.get('content-length');
            const acceptRanges = response.headers.get('accept-ranges');

            if (contentRange) responseHeaders['Content-Range'] = contentRange;
            if (contentLength) responseHeaders['Content-Length'] = contentLength;
            if (acceptRanges) responseHeaders['Accept-Ranges'] = acceptRanges;

            return new NextResponse(stream, {
                status: response.status,
                headers: responseHeaders,
            });
        }
    } catch (error) {
        return NextResponse.json(
            { error: 'Proxy request failed' },
            { status: 500 }
        );
    }
}

export const GET = handler;
export const POST = handler;
export const PUT = handler;
export const DELETE = handler;
export const PATCH = handler;