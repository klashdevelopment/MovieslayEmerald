import { load } from 'cheerio';

import { MovieScrapeContext, NotFoundError, ShowMedia, ShowScrapeContext, SourcererOutput, flags } from "@movie-web/providers";

const baseUrl = 'https://mp4hydra.org/';
function normalizeTitle(title:string) {
    let titleTrimmed = title.trim().toLowerCase();
    if (titleTrimmed !== "the movie" && titleTrimmed.endsWith("the movie")) {
      titleTrimmed = titleTrimmed.replace("the movie", "");
    }
    if (titleTrimmed !== "the series" && titleTrimmed.endsWith("the series")) {
      titleTrimmed = titleTrimmed.replace("the series", "");
    }
    return titleTrimmed.replace(/['":]/g, "").replace(/[^a-zA-Z0-9]+/g, "_");
  }
  function compareTitle(a:string, b:string) {
    return normalizeTitle(a) === normalizeTitle(b);
  }
  function compareMedia(media:any, title:string, releaseYear:number|undefined) {
    const isSameYear = releaseYear === void 0 ? true : media.releaseYear === releaseYear;
    return compareTitle(media.title, title) && isSameYear;
  }

async function comboScraper(ctx: ShowScrapeContext | MovieScrapeContext): Promise<SourcererOutput> {
  const searchPage = await ctx.proxiedFetcher('/search', {
    baseUrl,
    query: {
      q: ctx.media.title,
    },
  });

  ctx.progress(40);

  const $search = load(searchPage);
  const searchResults: { title: string; year?: number | undefined; url: string }[] = [];

  $search('.search-details').each((_, element) => {
    const [, title, year] =
      $search(element)
        .find('a')
        .first()
        .text()
        .trim()
        .match(/^(.*?)\s*(?:\(?\s*(\d{4})(?:\s*-\s*\d{0,4})?\s*\)?)?\s*$/) || [];
    const url = $search(element).find('a').attr('href')?.split('/')[4];

    if (!title || !url) return;

    searchResults.push({ title, year: year ? parseInt(year, 10) : undefined, url });
  });

  const s = searchResults.find((x) => x && compareMedia(ctx.media, x.title, x.year))?.url;
  if (!s) throw new NotFoundError('No watchable item found');

  ctx.progress(60);

  var isShow = ctx.media.type === 'show';

  var params = { z: JSON.stringify([(isShow ? { s, t: 'tv', se: (ctx.media as ShowMedia).season.number, ep: (ctx.media as ShowMedia).episode.number } : { s, t: 'movie' })]) };
 
  const data: { playlist: { src: string; label: string }[]; servers: { [key: string]: string; auto: string } } =
    await ctx.proxiedFetcher('/info2?v=8', {
      method: 'POST',
      body: new URLSearchParams(params),
      baseUrl,
    });
 
  if (!data.playlist[0].src || !data.servers) throw new NotFoundError('No watchable item found');

  ctx.progress(80);

  const embeds: any[] = [];
  // rank the server as suggested by the api
  [
    data.servers[data.servers.auto],
    ...Object.values(data.servers).filter((x) => x !== data.servers[data.servers.auto] && x !== data.servers.auto),
  ].forEach((server, _) =>
    embeds.push({ embedId: `mp4hydra-${_ + 1}`, url: `${server}${data.playlist[0].src}|${data.playlist[0].label}` }),
  );

  ctx.progress(90);

  return {
    embeds,
  };
}

export const mp4hydraScraper = ({
  id: 'mp4hydra-custom',
  name: 'Mp4HydraC',
  rank: 6,
  flags: [flags.CORS_ALLOWED],
  scrapeMovie: comboScraper,
  scrapeShow: comboScraper,
});