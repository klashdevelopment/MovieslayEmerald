# MovieslayEmerald
Movieslay Emerald is a successor to the Movieslay webapp. We're an all in one robust movie & TV streaming solution built with user experience in mind. Stream movies, shows, and more with minimal latency and zero advertisements using our built-in player with 20+ sources.

<img width="3840" height="1987" alt="image" src="https://github.com/user-attachments/assets/1d862b6c-e823-43e7-9851-5ab0237b4789" />

Files for the Movieslay desktop and mobile apps are included too - supports iOS, Windows, and macOS.

## Hosting
You need to input at minimum a TMDB api key (get it free [here](https://docs.pstream.net/client/tmdb/)) in the .env. An example env is provided. A FEDDB key is the 'ui' cookie on febbox, which you can see a video to get [here](https://vimeo.com/1059834885/c3ab398d42?fl=pl&fe=ti). You can add Vyla's source using a Vyla api key, see that [here](https://vyla.mintlify.app/authentication).

```bash
npm i
npm run dev # dev
npm start # prod
```

### TODO
- Save watch progress
- Custom PiP popup
- Profiles
- Add webtorrent streamer

### AI and components

AI (specifically Claude and Github Copilot) were used for utility functions and completions throughout. Some components (homepage line graphic and movies/shows/search fluid backgrounds) come from Aceternity UI.
