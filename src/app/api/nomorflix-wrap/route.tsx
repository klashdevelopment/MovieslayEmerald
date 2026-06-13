import { NextRequest, NextResponse } from "next/server";

/* !-> The code below was an attempt to dynamically fetch the source order
   !-> from streamguide but it only bruteforces correctly in the browser
   !-> for some reason. The sources dont rotate much so its probably fine. */
// you can also try decoding via AESkey "145deaa5ca1487d5143bd5513798602568bc463de4b6cfd7746b90459167b44a" and rc4 "3MDp"
//#region bruteforce source
// const SOURCE_ORDER_URL = "https://streamguide.cfd/library/source-order";
// const API_URL = "https://streamguide.cfd/embed/api.js";
// async function getArr() {
//     const fetchRes = await fetch(API_URL);
//     const text = await fetchRes.text();
//     if (!text) return null;
//     return text.match(/const\s+\w+\s*=\s*(\[[\s\S]*?\]);/)?.[1] || null;
// }
// const keys = [
//     "vXJ0",
//     "syr9",
//     "9Nys",
//     "9**Q",
//     "Nji$",
//     "LPy8",
//     "9FF3",
//     "EBn7",
//     "WRdP",
//     "KQi%",
//     "q6G#",
//     "XR!c",
//     "V$iZ",
//     "lHdS",
//     "hesw",
//     "AepT",
//     "aiK7",
//     "dloJ",
//     "kOSg",
//     "RzuJ",
//     "o6n8",
//     "VjTJ",
//     "uxG@",
//     "1B^h",
//     "5L72",
//     "vqWc",
//     "AVUs",
//     "UaYC",
//     "Ru*)",
//     "N8Nm",
//     "c!Iq",
//     "[Cpx",
//     "]PIy",
//     "fEZO",
//     "JCDP",
//     "vhS]",
//     "&K1Y",
//     "6IoI",
//     "Rtfr",
//     "03t2",
//     "yV5r",
//     "WE[4",
//     "G@bF",
//     "0D*l",
//     "szvj",
//     "21Ip",
//     "TdMI",
//     "Q!HP",
//     "i*TX",
//     "3MDp",
//     "JKNW",
//     "8Ovm",
//     "a)Bw",
//     "s^c0",
//     "zqna",
//     "UlXF",
//     "gjOe",
//     "pnLa",
//     "rgCt",
//     "l&OG",
//     "Hnb%",
//     "cXfm",
//     "11L4",
//     "NNs!",
//     "vzae",
//     "N6Uj",
//     "UvrW",
//     "BHED",
//     "Hjgj",
//     "vJ$M",
//     "1Kx9",
//     "AAoW",
//     "Zoxw",
//     "QP$V",
//     "tHvJ",
//     "ltew",
//     "w8!a",
//     "zm@q",
//     "KZ%c",
//     "KC^r",
//     "VRC7",
//     "f72o",
//     "nP8s",
//     "nHO0",
//     "dQoy",
//     "UYL]",
//     "ePU5",
//     "V7#N",
//     "rU(C",
//     "KXJy",
//     "oGM(",
//     "VWVW",
//     "FCLP",
//     "@%nH",
//     "PMp2",
//     "onmO",
//     "C#^A",
//     "0vY6"
// ]

// // yes its bruteforce but its like one second
// async function bruteForce(payload: string, offset = 0x166) {
//     const arr = await getArr();
//     if(!arr) return {err:"noarr"};
//     function customB64decode(input: string) {
//         const chars =
//             "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789+/="
//         let output = "",
//             temp = ""

//         for (let i = 0, acc, ch, pos = 0; (ch = input.charAt(pos++));) {
//             ch = chars.indexOf(ch)

//             if (~ch) {
//                 // @ts-ignore
//                 acc = i % 4 ? (acc) * 64 + ch : ch

//                 if (i++ % 4) {
//                     output += String.fromCharCode(0xff & (acc >> ((-2 * i) & 6)))
//                 }
//             }
//         }

//         for (let j = 0; j < output.length; j++) {
//             temp += "%" + ("00" + output.charCodeAt(j).toString(16)).slice(-2)
//         }

//         return decodeURIComponent(temp)
//     }

//     function rc4Decrypt(str: string, key: string) {
//         const s = []
//         const result = []

//         let j = 0

//         for (let i = 0; i < 256; i++) s[i] = i

//         for (let i = 0; i < 256; i++) {
//             j = (j + s[i] + key.charCodeAt(i % key.length)) % 256
//                 ;[s[i], s[j]] = [s[j], s[i]]
//         }

//         let i = 0
//         j = 0

//         for (let k = 0; k < str.length; k++) {
//             i = (i + 1) % 256
//             j = (j + s[i]) % 256

//                 ;[s[i], s[j]] = [s[j], s[i]]

//             result.push(
//                 String.fromCharCode(str.charCodeAt(k) ^ s[(s[i] + s[j]) % 256])
//             )
//         }

//         return result.join("")
//     }

//     function isValidHexKey(str: string) {
//         const clean = str.replace(/\s/g, "")

//         return (
//             /^[0-9a-fA-F]+$/.test(clean) &&
//             (clean.length === 32 || clean.length === 48 || clean.length === 64)
//         )
//     }

//     const hits = []

//     for (let i = 0; i < arr.length; i++) {
//         for (const key of keys) {
//             try {
//                 const decoded = rc4Decrypt(customB64decode(arr[i]), key)

//                 // console.log("decoded", decoded);

//                 if (!isValidHexKey(decoded)) continue

//                 hits.push({
//                     key,
//                     rawIndex: i + offset,
//                     hex: decoded.replace(/\s/g, "")
//                 })
//             } catch { }
//         }
//     }

//     const raw = Uint8Array.from(atob(payload), c => c.charCodeAt(0))

//     for (const hit of hits) {
//         try {
//             const keyBytes = new Uint8Array(
//                 hit.hex.match(/../g)!.map(x => parseInt(x, 16))
//             )

//             const cryptoKey = await crypto.subtle.importKey(
//                 "raw",
//                 keyBytes,
//                 { name: "AES-GCM" },
//                 false,
//                 ["decrypt"]
//             )

//             const decrypted = await crypto.subtle.decrypt(
//                 {
//                     name: "AES-GCM",
//                     iv: raw.slice(0, 12)
//                 },
//                 cryptoKey,
//                 raw.slice(12)
//             )

//             return {
//                 text: new TextDecoder().decode(decrypted),
//                 key: hit.key,
//                 keyIndex: hit.rawIndex,
//                 aesKey: hit.hex
//             }
//         } catch { }
//     }

//     return null
// }
//#endregion

// sources


// this array is a morph of the browser decompiled source-order (below) as well as the ui for languages.
// {"globalOrder":{"movietv":["crius","theia","iris","leto","moviesapi","helios","vega","poseidon","apollo","mnemosyne","hades","athena","morpheus","hephaestus","styx","aphrodite","cronus","hecate"],"anime":["rhea","metisbonk","metis","hyperion","iapetus","nyx","asteria","aphrodite","tethys","erebus","heracles","aether","tartarus","calypso","indra"]},"titleOverrides":{},"hidden":["vega"],"updated":1781182247.92928}
const SOURCES = {
    movies_tv: {
        /* english */ en: ['Crius', 'Theia', 'Persephone', 'moviesapi', 'Leto', 'Hemera', 'Helios', 'vega', 'Selene'],
        /* spanish */ es: ['Zeus', 'Boreas', 'Hecate'],
        /* portuguese */ br: ['Hera', 'Nike', 'Tyche'],
        /* french */ fr: ['Poseidon', 'Hebe', 'Notus'],
        /* german */ de: ['Hades', 'Mnemosyne', 'Cronus'],
        /* italian */ it: ['Ares', 'Iris', 'Nyx'],
        /* hindi */ hi: ['Athena', 'Hermes'],
    },
    anime: {
        /* english */ en: ['Zephyr', 'Eurus', 'Triton', 'Pontus'],
        /* spanish */ es: ['Boreas'],
        /* portuguese */ br: ['Prometheus', 'Coeus'],
        /* french */ fr: ['Medea', 'Eos'],
        /* german */ de: ['Nereus', 'Thanatos'],
        /* italian */ it: ['Nemesis', 'Circe'],
        /* hindi */ hi: ['Gaia', 'Epimetheus', 'Indra'],
        /* japanese */ jp: [
            'Rhea',
            'Icarus',
            'Metis',
            'Hyperion',
            'Iapetus',
            'Asteria',
            'Tethys',
            'Erebus',
            'Pandora',
            'Oceanus'
        ]
    }
};

const SOURCE_URLS = {
    movie: (src: string, id: string) => `https://streamguide.cfd/${src}/movie/${id}?verify=false`,
    tv: (src: string, id: string, s: string, e: string) => `https://streamguide.cfd/${src}/tv/${id}/${s}/${e}?verify=false`,
    anime: (src: string, id: string, episode: string, mal?: string | undefined) => `https://streamguide.cfd/${src}/anime/${id}/${episode}?mal=${mal||id}&verify=false`
}

export async function GET(request: NextRequest) {
    const params = new URL(request.url).searchParams;
    const id = params.get('id') ?? undefined;
    const s = params.get('s') ?? undefined;
    const e = params.get('e') ?? undefined;
    const type = params.get('type') ?? undefined;
    const source = params.get('source') ?? undefined;
    const mal = params.get('malId') ?? undefined;

    if (type === 'list') {
        return NextResponse.json({
            sources: SOURCES
        })
    }

    if (!id || !source) {
        return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 });
    }

    const url =
        type === 'movie' ? SOURCE_URLS.movie(source, id) :
            type === 'tv' ? SOURCE_URLS.tv(source, id, s || '1', e || '1') :
                type === 'anime' ? SOURCE_URLS.anime(source, id, e || '1', mal) :
                    null;

    if (!url) {
        return NextResponse.json({ error: 'Invalid type parameter' }, { status: 400 });
    }

    try {
        const resp = await fetch(url);
        const data = await resp.json();

        if (!data.providers) return NextResponse.json({
            sources: []
        })

        // data.subtitles DOES contain a {url,lang}[] but all of em seem to be broken? possibly their own internal proxy

        // this is in Movieslay format but you can change it to vyla's format
        // data.providers is [{provider:2,sources:[]},{provider:1,sources:[]}] with sources being {url, language(ex. English), type(hls | mp4)}

        const sources = data.providers.flatMap((provider: any) =>
            provider.sources.map((source: any) => ({
                url: source.url,
                language: source.language,
                type: source.type
            }))
        );

        return NextResponse.json({
            sources: sources
        })
    } catch(err: any) {
        return NextResponse.json({
            sources: [],
            error: err.message
        })
    }
}