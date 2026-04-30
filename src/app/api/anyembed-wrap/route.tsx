import { NextRequest, NextResponse } from "next/server";

const BASE_URL = "https://api.anyembed.xyz";
const SESSION_URL = `${BASE_URL}/api/v1/session`;
const TOKEN_EXPIRE_BUFFER = 10_000;

interface SessionResponse {
  expires_in: number;
  success: boolean;
  token: string;
}

// Module-level token state (persists across requests in the same serverless instance)
let token: string | null = null;
let tokenExpiresAt: number | null = null;
let sessionPromise: Promise<void> | null = null;

async function refreshToken(): Promise<void> {
  const res = await fetch(SESSION_URL);
  if (!res.ok) throw new Error(`Failed to fetch session: ${res.status}`);
  const data: SessionResponse = await res.json();
  token = data.token;
  tokenExpiresAt = Date.now() + data.expires_in * 1000;
}

function isTokenExpired(): boolean {
  if (!token || !tokenExpiresAt) return true;
  return Date.now() >= tokenExpiresAt - TOKEN_EXPIRE_BUFFER;
}

async function ensureToken(): Promise<string> {
  if (isTokenExpired()) {
    if (!sessionPromise) {
      sessionPromise = refreshToken().finally(() => {
        sessionPromise = null;
      });
    }
    await sessionPromise;
  }
  return token!;
}

// Maps your local proxy paths to upstream AnyEmbed paths.
// GET /api/anyembed/stream/[id]    → /api/v1/stream/[id]
// GET /api/anyembed/known-server   → /api/known-server
// GET /api/anyembed/providers      → /api/providers
// GET /api/anyembed/meta           → /api/meta
// GET /api/anyembed/[...anything]  → pass-through
function resolveUpstreamPath(pathname: string): string {
  // Strip the local proxy prefix, e.g. "/api/anyembed/stream/123" → "/stream/123"
  const stripped = pathname.replace(/^\/api\/anyembed/, "");
  return stripped || "/";
}

export async function GET(req: NextRequest) {
  try {
    const sessionToken = await ensureToken();

    const { pathname, searchParams } = req.nextUrl;
    const upstreamPath = resolveUpstreamPath(pathname);
    const upstreamUrl = new URL(`${BASE_URL}${upstreamPath}`);

    // Forward all query params
    searchParams.forEach((value, key) => {
      upstreamUrl.searchParams.set(key, value);
    });

    const upstream = await fetch(upstreamUrl.toString(), {
      headers: { "x-session-token": sessionToken },
    });

    // Stream the body straight through
    const body = await upstream.arrayBuffer();

    const headers = new Headers();
    // Forward content-type and content-length if present
    const ct = upstream.headers.get("content-type");
    if (ct) headers.set("content-type", ct);
    const cl = upstream.headers.get("content-length");
    if (cl) headers.set("content-length", cl);

    return new NextResponse(body, {
      status: upstream.status,
      headers,
    });
  } catch (err) {
    console.error("[anyembed proxy]", err);
    return NextResponse.json({ error: "Proxy error" }, { status: 500 });
  }
}