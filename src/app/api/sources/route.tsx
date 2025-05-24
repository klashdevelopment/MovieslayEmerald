/*const media = {
          type: "movie",
          title: "A Minecraft Movie",
          releaseYear: 2025,
          tmdbId: "950387",
        } as ScrapeMedia;*/

import { buildProviders, EmbedOutput, makeProviders, makeStandardFetcher, NotFoundError, ScrapeMedia, SourcererOutput, targets } from "@movie-web/providers";
import { FedAPIScraper } from "./custom/fedapi";
import { mp4hydraScraper } from "./custom/mp4h";
import { vidsrcmeScraper } from "./custom/vidsrcme";
import { vidsrcsuScraper } from "./custom/vidsrcsu";
import { FedAPICustomScraper, FedDBCustomScraper } from "./custom/fedapi-embeds";

export async function POST(request: Request) {
    const body = await request.json();
    const media = body.media as ScrapeMedia;
    const preferredSource = body.source as string;
    const myFetcher = makeStandardFetcher(fetch);
    const providers = buildProviders()
    .setTarget(targets.NATIVE)
    .addBuiltinProviders()
    .addSource(FedAPIScraper as any)
    .addSource(mp4hydraScraper as any)
    .addSource(vidsrcmeScraper as any)
    .addSource(vidsrcsuScraper as any)
    .addEmbed(FedDBCustomScraper as any)
    .addEmbed(FedAPICustomScraper as any)
    .setFetcher(myFetcher)
    .build();

    const sourceScrapers = providers.listSources();
    let sourceOrder = sourceScrapers
        .filter((source) => source.id !== "soapaertv")
        .map((source) => source);

    if (preferredSource) {
        var ss = sourceOrder.find((source) => source.id === preferredSource);
        if(!ss) {
            return new Response(JSON.stringify({ error: "Source not found" }), { status: 404 });
        }
        sourceOrder = [
            ss,
            ...sourceOrder.filter((source) => source.id !== preferredSource),
        ];
    }

    let output: Record<string, SourcererOutput> = {};
    let found: ({name:string,id:string,has:boolean}|any[])[] = [[]];
    let embeds: any[] = [];
    // wait for all the promises to resolve
    await Promise.all(sourceOrder.map(async (source) => {
        try {
            output[source.id] = await providers.runSourceScraper({
                id: source.id,
                media: media
            });
            if(output[source.id].embeds.length > 0) {
                output[source.id].embeds.forEach((embed) => {
                    if(embed.url) {
                        embeds.push({
                            embedId: embed.embedId,
                            url: embed.url,
                            sourceId: source.id
                        });
                    }
                });
            }
            if(output[source.id].stream || output[source.id].embeds.length > 0) {
                found.push({name:source.name, id:source.id, has:true});
            }else {
                found.push({name:source.name, id:source.id, has:false});
            }
        } catch (err) {
            found.push({name:source.name, id:source.id, has:false});
        }
    }));
    await Promise.all(embeds.map(async (embed) => {
        try {
            const embedOutput = await providers.runEmbedScraper({
                id: embed.embedId,
                url: embed.url
            });
            if(embedOutput.stream) {
                if(!output[embed.sourceId].stream) {
                    output[embed.sourceId].stream = embedOutput.stream;
                } else {
                    output[embed.sourceId].stream = [...(output[embed.sourceId].stream as any), ...embedOutput.stream];
                }
            }
        } catch (err) {
            console.log(`${embed.embedId} error: ${err}`);
            (found[0] as any[]).push({embed:true,name:embed.embedId, id:embed.sourceId, has:false});
        }
    }));
    // remove all sources that are null or undefined
    Object.keys(output).forEach((key) => {
        if (output[key] === null || output[key] === undefined) {
            delete output[key];
        }
    });
    if(Object.keys(output).length === 0) {
        return new Response(JSON.stringify({ error: "No results found" }), { status: 404 });
    }
    request.headers.set("Content-Type", "application/json");
    return new Response(JSON.stringify({output, found}), {
        status: 200,
        headers: {
            "Content-Type": "application/json",
        },
    });
}

export function GET(request: Request) {
    return new Response("POST with a {title, type:movie, releaseYear, tmdbId, imdbId?} or {title, type:show, episode:{number,tmdbId}, season:{number,tmdbId}, imdbId?, tmdbId, releaseYear}", {
        status: 200,
        headers: {
            "Content-Type": "text/plain",
        },
    });
}