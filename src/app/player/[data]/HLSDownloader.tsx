"use client";

export async function getChunks(url: string): Promise<string[]> {
    const visited = new Set<string>();

    const loadPlaylist = async (playlistUrl: string): Promise<string[]> => {
        if (visited.has(playlistUrl)) {
            return [];
        }

        visited.add(playlistUrl);

        const response = await fetch(playlistUrl);
        if (!response.ok) {
            throw new Error(`Failed to fetch HLS playlist: ${response.statusText}`);
        }

        const text = await response.text();
        const baseUrl = new URL(playlistUrl);
        const lines = text
            .split("\n")
            .map(line => line.trim())
            .filter(line => line && !line.startsWith("#"));

        const chunks: string[] = [];

        for (const line of lines) {
            const resolvedUrl = new URL(line, baseUrl).toString();
            if (/\.m3u8($|\?)/i.test(resolvedUrl)) {
                chunks.push(...await loadPlaylist(resolvedUrl));
            } else {
                chunks.push(resolvedUrl);
            }
        }

        return chunks;
    };

    return loadPlaylist(url);
}

const DB_NAME = "hls-downloader";
const STORE_NAME = "chunks";

async function openDB(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
        const req = indexedDB.open(DB_NAME, 1);
        req.onupgradeneeded = () => req.result.createObjectStore(STORE_NAME);
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => reject(req.error);
    });
}

async function writeChunk(db: IDBDatabase, index: number, data: Uint8Array): Promise<void> {
    return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, "readwrite");
        tx.objectStore(STORE_NAME).put(data, index);
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
    });
}

async function readChunk(db: IDBDatabase, index: number): Promise<Uint8Array> {
    return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, "readonly");
        const req = tx.objectStore(STORE_NAME).get(index);
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => reject(req.error);
    });
}

async function clearDB(db: IDBDatabase): Promise<void> {
    return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, "readwrite");
        tx.objectStore(STORE_NAME).clear();
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
    });
}

export class HLSDownloader {
    // this should function similar to mega.nz's super download - fetch chunks of the HLS stream into memory, then download once its done.
    // it should have progress, and be able to cancel the download, and have a callback input to recieve event (done, progress, etc)
    // we'll only download one at a time via one HLSDownloader instance
    // FFMPEG.WASM can be used to merge the chunks into a single file, and then we can use the browser's download API to download the file.
    private url: string;
    private onProgress: (progress: number) => void;
    private onDone: (blob: Blob) => void;
    private onError: (error: Error) => void;
    isCancelled = false;
    progress = 0;
    stage: 'fetching' | 'downloading' | 'merging' | 'done' = "fetching";

    constructor(url: string, onProgress: (progress: number) => void, onDone: (blob: Blob) => void, onError: (error: Error) => void) {
        this.url = url;
        this.onProgress = onProgress;
        this.onDone = onDone;
        this.onError = onError;
    }

    async start() {
        const JSZip = await import("jszip");
        const db = await openDB();

        try {
            this.stage = "fetching";
            const chunkUrls = await getChunks(this.url);
            const totalChunks = chunkUrls.length;
            let downloadedChunks = 0;

            this.stage = "downloading";
            await Promise.all(
                chunkUrls.map(async (chunkUrl, index) => {
                    if (this.isCancelled) return;
                    const response = await fetch(chunkUrl);
                    if (!response.ok) throw new Error(`Failed to fetch chunk: ${response.statusText}`);
                    const data = new Uint8Array(await response.arrayBuffer());
                    await writeChunk(db, index, data);  // write to IDB, not memory
                    downloadedChunks++;
                    this.progress = downloadedChunks / totalChunks;
                    this.onProgress(this.progress);
                })
            );

            if (this.isCancelled) return;

            this.stage = "merging";
            const zip = new JSZip.default();

            for (let i = 0; i < totalChunks; i++) {
                const chunk = await readChunk(db, i);
                zip.file(`chunk${i}.ts`, chunk);
            }

            const mergeBatResponse = await fetch("/utility/merge.bat");
            if (!mergeBatResponse.ok) {
                throw new Error(`Failed to fetch merge.bat: ${mergeBatResponse.statusText}`);
            }
            const mergeBatContent = await mergeBatResponse.text();
            zip.file("MERGE_FILES.bat", mergeBatContent);

            const mergeShResponse = await fetch("/utility/merge.sh");
            if (!mergeShResponse.ok) {
                throw new Error(`Failed to fetch merge.sh: ${mergeShResponse.statusText}`);
            }
            const mergeShContent = await mergeShResponse.text();
            zip.file("MERGE_FILES.sh", mergeShContent);


            const zipBlob = await zip.generateAsync({ type: "blob" });

            this.stage = "done";
            this.onDone(zipBlob);
        } catch (error: any) {
            this.onError(error);
        }
    }

    cancel() {
        this.isCancelled = true;
    }
}