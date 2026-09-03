# Redwood

Front-end CS2 match & tournament panel for [G5API](https://github.com/PhlexPlexico/G5API).

Fork / modernization of [Get5Vue (G5V)](https://github.com/PhlexPlexico/G5V): **Vue 3**, **Vuetify 3**, **Vite**, CS2-inspired UI, native single-elim tournaments with a public bracket.

---

## Stack

| Piece | Version |
| --- | --- |
| Vue | 3.5 |
| Vuetify | 3.7 |
| Vite | 6 |
| Vue Router / Vuex / vue-i18n | 4 / 4 / 10 |
| Axios | 1.x |

Requires a running **G5API** instance (Steam login, matches, RCON, stats). The Steam Web API key is configured **in G5API**, not in this repo — see [G5API Configuration](https://github.com/PhlexPlexico/G5API/wiki/Configuration).

---

## Features

- Teams, servers, matches (create / control via RCON)
- Seasons + **tournament mode** (single elimination)
  - Public bracket tree for visitors
  - Round 1 auto-starts on your server pool
  - Later rounds auto-advance when an organizer has the season page open
- Leaderboards (global & per season)
- Player / match stats, vetoes, live SSE updates
- Challonge import (via G5API)
- Dark / light theme (CS2-inspired)
- Translations: English, Français, 日本語
- Default **Redwood map pool** (Inferno, Ancient, Mirage, Nuke, Anubis, Dust II, Vertigo, Overpass, Cache, Train)

---

## Setup

### Prerequisites

- Node.js 20+
- npm (recommended) or yarn
- Working [G5API](https://github.com/PhlexPlexico/G5API) (default proxy target: `http://localhost:3301`)

### Environment

Create a `.env` (or `.env.local`) at the project root:

```env
VITE_G5V_API_URL=
```

Leave empty to use the Vite/nginx proxy path `/api`.  
Or set a full URL (no trailing slash), e.g. `https://api.example.com`.

`VUE_APP_G5V_API_URL` is still accepted as a fallback for Docker/build args.

### Install & develop

```bash
npm install
npm run serve
```

Dev server: `http://localhost:5173`  
`/api` is proxied to `http://localhost:3301` (see `vite.config.js`).

```bash
npm run build    # output → dist/
npm run preview  # preview production build
npm run lint
```

Equivalent with yarn: `yarn`, `yarn serve`, `yarn build`.

---

## Docker

Three Dockerfiles are included: `DockerfileLight`, `DockerfileFull`, `DockerfileLightCaddy`.

### DockerfileLight

Build the app on the host first, then serve `dist/` with nginx:

```bash
npm install
npm run build
docker build -t yourname/redwood:latest -f DockerfileLight .
docker run --name redwood -p 80:80 yourname/redwood:latest
```

### DockerfileFull

Builds inside the image (Node 20; uses yarn in the container):

```bash
docker build -t yourname/redwood:latest -f DockerfileFull \
  --build-arg VITE_G5V_API_URL=https://your-api.example.com .
docker run --name redwood -p 80:80 yourname/redwood:latest
```

`VUE_APP_G5V_API_URL` is also accepted as build-arg.

### DockerfileLightCaddy

Same as Light, with Caddy. Build on the host (`npm run build`), then:

```bash
docker build -t yourname/redwood:caddy -f DockerfileLightCaddy .
docker run --name redwood -p 80:80 yourname/redwood:caddy
```

The front-end expects G5API behind `/api` (or the URL set at build time). Reverse-proxy examples: [G5V wiki](https://github.com/PhlexPlexico/G5V/wiki).

---

## Tournament quick start

1. Log in (Steam via G5API).
2. Ensure you have teams + at least one free server.
3. Menu → **Create Tournament** (`/tournament/create`).
4. Pick teams, server pool, map pool → **Create & start round 1**.
5. Open `/season/:id` — bracket is visible to everyone; keep the page open as organizer for auto-advance.

Map pool: profile → **Import Redwood map pool**, or rely on the built-in fallback list.

---

## Project layout

```
src/
  components/     UI (tables, match HUD, tournament bracket, …)
  views/          Routes (Home, Match, Season, CreateTournament, …)
  plugins/        Vuetify theme + SSE helper
  utils/          API mixin, tournament helpers, map pool
  styles/         Global CS2 theme (dark/light)
  translations/   en / fr / jp
```

---

## Issues

- **Match / API / Steam auth** → [G5API issues](https://github.com/PhlexPlexico/G5API/issues)
- **UI / bracket / front-end** → this repository

---

## Credits

Based on **Get5Vue / G5API** by [PhlexPlexico](https://github.com/PhlexPlexico) and contributors.

Special thanks (upstream):

- [Shugo "FlowingSPDG" Kawamura](https://github.com/FlowingSPDG) — translations & get5-web-go
- [Sean Lewis](https://github.com/splewis) — get5
- Smimabo, ebuttonsdude, [kubo6472](https://github.com/kubo6472)

---

## Screenshots

![](./screenshots/MainPage.png)  
![](./screenshots/MainPageLoggedIn.png)  
![](./screenshots/SideMenuLoggedOut.png)  
![](./screenshots/SideMenuLoggedIn.png)  
![](./screenshots/TeamPage.png)  
![](./screenshots/TeamSpecificPage.png)  
![](./screenshots/MatchInfo.png)  
![](./screenshots/ProfilePage.png)  
![](./screenshots/ServersPage.png)

---

## License

[MIT License](http://opensource.org/licenses/MIT). A copy of this license **must** be included with the software.
