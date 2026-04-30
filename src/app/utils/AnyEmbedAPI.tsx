const BASE_URL = "/api/anyembed";

interface MetaParams {
  tmdbId?: string | number;
  imdbId?: string | number;
  title?: string;
  year?: string | number;
  type?: string;
}

export class AnyEmbedAPI {
  private async get(path: string, params?: Record<string, string>): Promise<Response> {
    const url = new URL(path, location.origin);
    if (params) {
      for (const [k, v] of Object.entries(params)) {
        url.searchParams.set(k, v);
      }
    }
    return fetch(url.toString());
  }

  async stream(mediaId: string | number): Promise<Response> {
    return this.get(`${BASE_URL}/api/v1/stream/${mediaId}`);
  }

  async knownServer(mediaId: string | number): Promise<Response> {
    return this.get(`${BASE_URL}/api/known-server`, { media_id: String(mediaId) });
  }

  async providers(): Promise<Response> {
    return this.get(`${BASE_URL}/api/providers`);
  }

  async meta(params: MetaParams): Promise<Response> {
    const p: Record<string, string> = {};
    if (params.tmdbId != null) p.tmdb_id = String(params.tmdbId);
    if (params.imdbId != null) p.imdb_id = String(params.imdbId);
    if (params.title != null) p.title = params.title;
    if (params.year != null) p.year = String(params.year);
    if (params.type != null) p.type = params.type;
    return this.get(`${BASE_URL}/api/meta`, p);
  }
}