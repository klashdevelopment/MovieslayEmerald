function extractMovies(html: string) {
    const unescaped = html.replace(/\\\//g, '/');
    return [...unescaped.matchAll(/href="\/(?:movie|tv)\/detail\/(\d+)"[\s\S]*?class="film-name">([\s\S]*?)<\/h3>/g)]
        .map(([, id, name]) => ({ id, name: name.trim().replace(/&amp;/g, '&') }));
}

export function GET(req: Request) {
    const { searchParams } = new URL(req.url);
    const query = searchParams.get("query") || "";
    const type = searchParams.get("type") || "movie"; // movie or tv
    const season = searchParams.get("season");
    const episode = searchParams.get("episode");
    if (!query) {
        return new Response(JSON.stringify({ error: "Query parameter is required" }), { status: 400 });
    }

    // 1. POST https://showbox.media/search/autocomplate2 with body { "keyword": Show name }
    // 2. Parse that for the id of the one that matches our query (if any)
    // 3. GET to https://showbox.media/index/share_link?id=ID&type=(movie ? 1 : 2) to get the febbox SHARE link
    // 4. That data is {data:{link}}. Link is in format https://febbox.com/share/xxxxxx. We want the xxxxxx part, which is the ID we can use to fetch the actual sources from febbox
    // 5. GET to https://febbox.com/file/file_share_list?share_key=xxxxxx to get the sources.
    // That reply is {msg:"success",code:0,data:{ file_list: [...] }}
    // 6. You'll next need to parse it if its a show. The below code is for another implementation so it wont match exactly but it will work
    /* if (type === 'show') {
        const seasonFolder = streams.find((v) => {
        if (!v.is_dir) return false;
        return v.file_name.toLowerCase() === `season ${season}`;
        });
        if (!seasonFolder) return [];

        const episodes = await getFileList(ctx, shareKey, seasonFolder.fid);
        const s = season?.toString() ?? '0';
        const e = episode?.toString() ?? '0';
        const episodeRegex = new RegExp(`[Ss]0*${s}[Ee]0*${e}`);
        return episodes
        .filter((file) => {
            if (file.is_dir) return false;
            const match = file.file_name.match(episodeRegex);
            if (!match) return false;
            return true;
        })
        .filter(isValidStream);
    }*/
    // isValidStream just checks if the file.ext = mp4 | mkv
    // 7. The sources are in format {file_name, ext, oss_fid, fid, ...} ~~and the actual link to the file is https://febbox.com/hls/main/oss_fid.m3u8~~

    if (!process.env.FEDDB) {
        return new Response(JSON.stringify({ error: "Server is not configured with FEDDB api" }), { status: 500 });
    }

    return fetch("https://showbox.media/search/autocomplate2", {
        "headers": {
            "accept": "*/*",
            "accept-language": "en-US,en;q=0.7",
            "cache-control": "no-cache",
            "content-type": "application/x-www-form-urlencoded; charset=UTF-8",
            "pragma": "no-cache",
            "priority": "u=1, i",
            "sec-ch-ua": "\"Chromium\";v=\"148\", \"Brave\";v=\"148\", \"Not/A)Brand\";v=\"99\"",
            "sec-ch-ua-mobile": "?0",
            "sec-ch-ua-platform": "\"Windows\"",
            "sec-fetch-dest": "empty",
            "sec-fetch-mode": "cors",
            "sec-fetch-site": "same-origin",
            "sec-gpc": "1",
            "x-requested-with": "XMLHttpRequest"
        },
        "referrer": "https://www.showbox.media/movie/detail/53632",
        "method": "POST",
        "mode": "cors",
        "body": `keyword=${encodeURIComponent(query).replaceAll(/%20/g, "+")}`,
    })
        .then((res) => res.json())
        .then((html) => {
            const data = extractMovies(html);
            const match = data.find((item: any) => item.name.toLowerCase() === query.toLowerCase());
            if (!match) {
                return new Response(JSON.stringify({ error: "No matching movie or show found" }), { status: 404 });
            }
            return fetch(`https://www.showbox.media/index/share_link?id=${match.id}&type=${type === "movie" ? 1 : 2}`)
                .then((res) => res.json())
                .then((data) => {
                    const shareKey = data.data.link.split("/").pop();
                    return fetch(`https://febbox.com/file/file_share_list?share_key=${shareKey}`, {
                        headers: {
                            'accept-language': 'en', // needed
                        }
                    })
                        .then((res) => res.json())
                        .then(async(data) => {
                            if (data.msg !== "success" || data.code !== 1) {
                                return new Response(JSON.stringify({ error: "Failed to fetch sources from Febbox" }), { status: 500 });
                            }
                            let files = data.data.file_list;
                            if (type === "tv") {
                                const seasonFolder = files.find((v: any) => {
                                    if (!v.is_dir) return false;
                                    return v.file_name.toLowerCase() === `season ${season}`;
                                });
                                if (!seasonFolder) {
                                    return new Response(JSON.stringify({ error: "Season not found" }), { status: 404 });
                                }

                                // fetch the file list with the same share key but now with &parent_id
                                await fetch(`https://febbox.com/file/file_share_list?share_key=${shareKey}&parent_id=${seasonFolder.fid}`, {
                                    headers: {
                                        'accept-language': 'en', // needed
                                    }
                                })
                                    .then((res) => res.json())
                                    .then((data) => {
                                        if (data.msg !== "success" || data.code !== 1) {
                                            return new Response(JSON.stringify({ error: "Failed to fetch sources from Febbox" }), { status: 500 });
                                        }

                                        const regex = new RegExp(`[Ss]0*${season}[Ee]0*${episode}(?!\\d)`);
                                        files = data.data.file_list.filter((file: any) => {
                                            if (file.is_dir) return false;
                                            const match = file.file_name.match(regex);
                                            // console.log(file.file_name, regex, !!match);
                                            return !!match;
                                        });
                                    });

                                // console.log("Filtered files for TV show:", files);
                            }
                            return Promise.all(files.map((file: any) => {
                                return fetch("https://www.febbox.com/file/player", {
                                    method: "POST",
                                    headers: {
                                        "content-type": "application/x-www-form-urlencoded; charset=UTF-8",
                                        'accept-language': 'en-US,en;q=0.5',
                                        'x-requested-with': 'XMLHttpRequest',
                                        'sec-ch-ua': '"Chromium";v="148", "Brave";v="148", "Not/A)Brand";v="99"',
                                        'cookie': `ui=${process.env.FEDDB}`
                                    },
                                    body: `fid=${file.fid}&share_key=${shareKey}`,
                                })
                                    .then((res) => res.text())
                                    .then((text) => {
                                        const ossFidMatch = text.match(/\/\/oss_fid:(\w+)/);
                                        if (!ossFidMatch) {
                                            return [];
                                        }
                                        const sourcesMatch = text.match(/var sources = (\[[\s\S]*?\]);/);
                                        if (!sourcesMatch) {
                                            return [];
                                        }
                                        const preferredLabels = ["AUTO", "4K", "1080", "720", "480", "360"];
                                        const sources = JSON.parse(sourcesMatch[1])
                                            .filter((s: any) => !s.label.toLowerCase().includes("audio"))
                                            .sort((a: any, b: any) => {
                                                const aIndex = preferredLabels.findIndex(label => a.label.toUpperCase().includes(label));
                                                const bIndex = preferredLabels.findIndex(label => b.label.toUpperCase().includes(label));
                                                return (aIndex === -1 ? Number.POSITIVE_INFINITY : aIndex) - (bIndex === -1 ? Number.POSITIVE_INFINITY : bIndex);
                                            });
                                        return sources.length ? [({
                                            ...sources[0],
                                            label: `${sources[0].label} ${file.file_name}`
                                        })] : [];
                                    });
                            })).then((results) => {
                                const sources = results.flat();
                                return new Response(JSON.stringify({ sources }), { status: 200 });
                            })
                        });
                });
        })
        .catch((error) => {
            console.error("Error fetching from Febbox:", error);
            return new Response(JSON.stringify({ error: "An error occurred while fetching sources" }), { status: 500 });
        });
}