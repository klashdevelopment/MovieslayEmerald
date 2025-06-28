import { MovieScrapeContext, ShowScrapeContext, SourcererOutput, flags } from "@movie-web/providers";

const getUserToken = (): string | null => {
  return (process.env.FEDDB || null);
};

async function comboScraper(ctx: ShowScrapeContext | MovieScrapeContext): Promise<SourcererOutput> {
  const query = {
    type: ctx.media.type,
    imdbId: ctx.media.imdbId,
    tmdbId: ctx.media.tmdbId,
    ...(ctx.media.type === 'show' && {
      season: ctx.media.season.number,
      episode: ctx.media.episode.number,
    }),
  };

  const userToken = getUserToken();
  const embeds = [];

  if (userToken) {
    embeds.push({
      embedId: 'fedapi-custom',
      url: `${JSON.stringify({ ...query, token: userToken })}`,
    });
  }

  embeds.push({
    embedId: 'feddb-custom',
    url: `${JSON.stringify(query)}`,
  });

  return {
    embeds,
  };
}

export const FedAPIScraper = {
    id: 'fedapi-scraper-custom',
    name: 'FED API (4K)',
    rank: 261,
    flags: [flags.CORS_ALLOWED],
    scrapeMovie: comboScraper,
    scrapeShow: comboScraper,
};