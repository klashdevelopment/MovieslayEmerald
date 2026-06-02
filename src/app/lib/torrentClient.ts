import WebTorrent, { Instance, Torrent } from 'webtorrent';

declare global {
    var _webtorrentClient: Instance | undefined;
}

export function getTorrentClient(): Instance {
    if (!global._webtorrentClient) {
        global._webtorrentClient = new WebTorrent();
        global._webtorrentClient.on('error', (err: any) => {
            if (err.message?.includes("Cannot read properties of null")) return;
            console.error('webtorrent error:', err);
        });
    }
    return global._webtorrentClient;
}

export function getOrAddTorrent(magnet: string): Promise<Torrent> {
  const client = getTorrentClient();
  
  const hashMatch = magnet.match(/btih:([a-fA-F0-9]{40})/i);
  const infoHash = hashMatch?.[1]?.toLowerCase();
  
  const existing = infoHash && client.torrents.find(t => t.infoHash === infoHash);
  if (existing) {
    resetTorrentTimeout(existing);
    return Promise.resolve(existing);
  }

  return new Promise((resolve, reject) => {
    client.add(magnet, torrent => {
      resetTorrentTimeout(torrent);
      resolve(torrent);
    });
    client.once('error', reject);
  });
}

const torrentTimers = new Map<string, NodeJS.Timeout>();

function resetTorrentTimeout(torrent: Torrent) {
  const existing = torrentTimers.get(torrent.infoHash);
  if (existing) clearTimeout(existing);

  const timer = setTimeout(() => {
    torrent.destroy();
    torrentTimers.delete(torrent.infoHash);
    console.log(`[torrent] cleaned up ${torrent.name}`);
  }, 5 * 60 * 1000); // 5 min of inactivity

  torrentTimers.set(torrent.infoHash, timer);
}