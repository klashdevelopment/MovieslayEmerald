import { NextRequest, NextResponse } from 'next/server';
import { getOrAddTorrent } from '../../lib/torrentClient';

export async function GET(req: NextRequest) {
  const magnet = req.nextUrl.searchParams.get('magnet');
  if (!magnet) return NextResponse.json({ error: 'no magnet' }, { status: 400 });

  const torrent = await getOrAddTorrent(magnet);

  const files = torrent.files.map(f => ({
    name: f.name,
    size: f.length,
    path: f.path,
  }));

  return NextResponse.json({ name: torrent.name, files });
}