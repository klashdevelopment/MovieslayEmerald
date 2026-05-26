import { NextRequest, NextResponse } from "next/server";

const ECHO_ORIGIN = "https://play2.echovideo.ru";
const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36";

function rewriteM3u8(text: string, baseUrl: string, selfPath: string): string {
  const base = new URL(baseUrl);
  const basePath = base.href.substring(0, base.href.lastIndexOf("/") + 1);

  return text.split("\n").map((line) => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) return line;
    const absUrl = trimmed.startsWith("http") ? trimmed : basePath + trimmed;
    return `${selfPath}?prx_url=${encodeURIComponent(absUrl)}`;
  }).join("\n");
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const prx_url = searchParams.get("prx_url");

  if (!prx_url) return NextResponse.json({ error: "Missing prx_url" }, { status: 400 });

  const url = decodeURIComponent(prx_url);

  const upstream = await fetch(url, {
    headers: {
      Origin: ECHO_ORIGIN,
      Referer: ECHO_ORIGIN + "/",
      "User-Agent": UA,
    },
  });

  const contentType = upstream.headers.get("content-type") ?? "application/octet-stream";
  const isM3u8 = contentType.includes("mpegurl") || url.endsWith(".m3u8");

  if (isM3u8) {
    const text = await upstream.text();
    const selfPath = new URL(req.url).pathname;
    const rewritten = rewriteM3u8(text, url, selfPath);
    return new NextResponse(rewritten, {
      status: upstream.status,
      headers: {
        "Content-Type": "application/vnd.apple.mpegurl",
        "Access-Control-Allow-Origin": "*",
      },
    });
  }

  const body = await upstream.arrayBuffer();
  return new NextResponse(body, {
    status: upstream.status,
    headers: {
      "Content-Type": contentType,
      "Access-Control-Allow-Origin": "*",
    },
  });
}