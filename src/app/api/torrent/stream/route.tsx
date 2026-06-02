import { NextRequest } from 'next/server';
import { getOrAddTorrent } from '../../../lib/torrentClient';
import { Readable } from 'stream';

export async function GET(req: NextRequest) {
  const magnet = req.nextUrl.searchParams.get('magnet');
  const fileName = req.nextUrl.searchParams.get('file');
  if (!magnet || !fileName) return new Response('missing params', { status: 400 });

  const torrent = await getOrAddTorrent(magnet);
  const file = torrent.files.find(f => f.name === fileName);
  if (!file) return new Response('file not found', { status: 404 });

  const rangeHeader = req.headers.get('range');
  const fileSize = file.length;

  let start = 0;
  let end = fileSize - 1;

  if (rangeHeader) {
    const match = rangeHeader.match(/bytes=(\d+)-(\d*)/);
    if (match) {
      start = parseInt(match[1]);
      end = match[2] ? parseInt(match[2]) : fileSize - 1;
    }
  }

  const chunkSize = end - start + 1;
  const nodeStream = file.createReadStream({ start, end }) as Readable;

  const webStream = new ReadableStream({
    start(controller) {
      nodeStream.on('data', chunk => controller.enqueue(chunk));
      nodeStream.on('end', () => controller.close());
      nodeStream.on('error', err => controller.error(err));
    },
    cancel() {
      nodeStream.destroy();
    }
  });

  return new Response(webStream, {
    status: rangeHeader ? 206 : 200,
    headers: {
      'Content-Type': 'video/mp4',
      'Content-Length': chunkSize.toString(),
      'Content-Range': `bytes ${start}-${end}/${fileSize}`,
      'Accept-Ranges': 'bytes',
    },
  });
}