const BASE_URL = "/api/anyembed-wrap";

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

  async stream(mediaId: string | number, season?: string, episode?: string): Promise<Response> {
    const params: Record<string, string> = { id: String(mediaId) };
    if (season) params.season = season;
    if (episode) params.episode = episode;
    if (season || episode) params.is_tv = "true";
    return this.get(`${BASE_URL}/api/v1/stream/${mediaId}`, params);
  }

  // add a route for proxy
  //https://api.anyembed.xyz/api/proxy?url=URL&headers=%7B%22Origin%22%3A%22https%3A%2F%2Fflixcdn.cyou%22%2C%22Referer%22%3A%22https%3A%2F%2Fflixcdn.cyou%2F%22%2C%22User-Agent%22%3A%22Mozilla%2F5.0%20(Windows%20NT%2010.0%3B%20Win64%3B%20x64)%20AppleWebKit%2F537.36%22%7D&origin=https%3A%2F%2F185.237.106.164&referer=https%3A%2F%2F185.237.106.164%2F
  async proxy(url: string, headers?: Record<string, string>): Promise<Response> {
    const params: Record<string, string> = { url };
    if (headers) {
      params.headers = JSON.stringify(headers);
    }
    return this.get(`${BASE_URL}/api/proxy`, params);
  }

  async genProxyURL(url: string, headers?: Record<string, string>): Promise<string> {
    const params: Record<string, string> = { url };
    if (headers) {
      params.headers = JSON.stringify(headers);
    }
    const query = new URLSearchParams(params).toString();
    return `/api/proxy?${query}`;
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