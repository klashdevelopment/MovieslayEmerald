import { randomUUID } from "crypto";
import { NextRequest, NextResponse } from "next/server";

const ENABLED = false;

const BASE_URL = "https://api.anyembed.xyz";
const SESSION_URL = `${BASE_URL}/api/v1/session`;
const TOKEN_EXPIRE_BUFFER = 10_000;

interface SessionResponse {
  expires_in: number;
  success: boolean;
  token: string;
}

let token: string | null = null;
let tokenExpiresAt: number | null = null;
let sessionPromise: Promise<void> | null = null;

async function refreshToken(): Promise<void> {
  const res = await fetch(SESSION_URL, {
    headers: {
      'x-embed-attest': randomUUID(),
      ...(await signRequest("/api/v1/session"))
    }
  });
  if (!res.ok) throw new Error(`Failed to fetch session: ${res.status}`);
  const data: SessionResponse = await res.json();
  token = data.token;
  tokenExpiresAt = Date.now() + data.expires_in * 1000; // TODO: investigate
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

async function signRequest(apiPath: string) {
  const signKey = "d035034d53a17fc7337fff6d3abe5df00d97ff438fa1f2f12e02710ae8bef3fe";
  const timestamp = Math.floor(Date.now() / 1000).toString();
  const nonce = crypto.randomUUID();
  const message = `${timestamp}:${apiPath}:${nonce}`;

  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(signKey),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );

  const signature = await crypto.subtle.sign("HMAC", key, encoder.encode(message));
  const hex = Array.from(new Uint8Array(signature))
    .map(b => b.toString(16).padStart(2, "0"))
    .join("");

  return {
    "x-anyembed-timestamp": timestamp,
    "x-anyembed-nonce": nonce,
    "x-anyembed-signature": hex,
  };
}

// Maps your local proxy paths to upstream AnyEmbed paths.
// GET /api/anyembed-wrap/stream/[id]    → /api/v1/stream/[id]
// GET /api/anyembed-wrap/known-server   → /api/known-server
// GET /api/anyembed-wrap/providers      → /api/providers
// GET /api/anyembed-wrap/meta           → /api/meta
// GET /api/anyembed-wrap/[...anything]  → pass-through
function resolveUpstreamPath(pathname: string): string {
  // Strip the local proxy prefix, e.g. "/api/anyembed-wrap/stream/123" → "/stream/123"
  const stripped = pathname.replace(/^\/api\/anyembed-wrap/, "");
  return stripped || "/";
}

export async function GET(req: NextRequest) {
  if(!ENABLED) return NextResponse.json({ error: "AnyEmbed scraper is disabled" }, { status: 503 });
  try {
    const sessionToken = await ensureToken();

    const { pathname, searchParams } = req.nextUrl;
    const upstreamPath = resolveUpstreamPath(pathname);
    const upstreamUrl = new URL(`${BASE_URL}${upstreamPath}`);

    // Forward all query params
    searchParams.forEach((value, key) => {
      upstreamUrl.searchParams.set(key, value);
    });

    const signs = await signRequest(upstreamPath);

    const upstream = await fetch(upstreamUrl.toString(), {
      headers: { "x-session-token": sessionToken, ...signs },
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