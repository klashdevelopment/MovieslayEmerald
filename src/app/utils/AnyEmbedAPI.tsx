const BASE_URL = "https://api.anyembed.xyz";
const SESSION_URL = `${BASE_URL}/api/v1/session`; // AnyEmbed is brand new, this could change.
const TOKEN_EXPIRE_BUFFER = 10_000; // Tokens expire in 60s on average, this is a 10s buffer to ensure we refresh before expiry.

interface SessionResponse {
  expires_in: number; // usually 60
  success: boolean;
  token: string;
}

interface MetaParams {
  tmdbId?: string | number;
  imdbId?: string | number;
  title?: string;
  year?: string | number;
  type?: string;
}

export class AnyEmbedAPI {
  private token: string | null = null;
  private tokenExpiresAt: number | null = null;
  private sessionPromise: Promise<void> | null = null;

  private async refreshToken(): Promise<void> {
    const res = await fetch(SESSION_URL);
    if (!res.ok) throw new Error(`Failed to fetch session: ${res.status}`);

    const data: SessionResponse = await res.json();
    this.token = data.token;
    this.tokenExpiresAt = Date.now() + data.expires_in * 1000;
  }

  private isTokenExpiry(): boolean {
    if (!this.token || !this.tokenExpiresAt) return true;
    return Date.now() >= this.tokenExpiresAt - TOKEN_EXPIRE_BUFFER;
  }

  private async ensureToken(): Promise<string> {
    if (this.isTokenExpiry()) {
      if (!this.sessionPromise) {
        this.sessionPromise = this.refreshToken().finally(() => {
          this.sessionPromise = null;
        });
      }
      await this.sessionPromise;
    }
    return this.token!;
  }

  async fetch(path: string): Promise<Response> {
    const token = await this.ensureToken();
    const url = path.startsWith("http") ? path : `${BASE_URL}${path}`;
    return globalThis.fetch(url, {
      headers: { "x-session-token": token },
    });
  }

  async stream(mediaId: string | number): Promise<Response> {
    return this.fetch(`/api/v1/stream/${mediaId}`);
  }

  async knownServer(mediaId: string | number): Promise<Response> {
    const token = await this.ensureToken();
    const url = new URL(`${BASE_URL}/api/known-server`);
    url.searchParams.set("media_id", String(mediaId));
    return globalThis.fetch(url.toString(), {
      headers: { "x-session-token": token },
    });
  }

  async providers(): Promise<Response> {
    const token = await this.ensureToken();
    return globalThis.fetch(`${BASE_URL}/api/providers`, {
      headers: { "x-session-token": token },
    });
  }

  async meta(params: MetaParams): Promise<Response> {
    const token = await this.ensureToken();
    const url = new URL(`${BASE_URL}/api/meta`);
    if (params.tmdbId != null) url.searchParams.set("tmdb_id", String(params.tmdbId));
    if (params.imdbId != null) url.searchParams.set("imdb_id", String(params.imdbId));
    if (params.title != null) url.searchParams.set("title", params.title);
    if (params.year != null) url.searchParams.set("year", String(params.year));
    if (params.type != null) url.searchParams.set("type", params.type);
    return globalThis.fetch(url.toString(), {
      headers: { "x-session-token": token },
    });
  }
}