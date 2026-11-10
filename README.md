# GamzoHub

Static website for [gamzohub.com](https://gamzohub.com): free browser games, no build step.
Deploy the repo root as-is to any static host (Cloudflare Pages, Netlify, Vercel).

## Run locally

```
npx serve -l 4322 .
```

Do not use `serve -s` (SPA mode): it rewrites every URL to the home page.

## Structure

| Path | Purpose |
|------|---------|
| `index.html` | Home: hero, "Play now" and "Coming soon" rows |
| `games/index.html` | All games, with search and category filters |
| `games/<slug>/` | One folder per game: `game.html`, `thumbnail.svg`, `metadata.json` |
| `play/<slug>/index.html` | Game page: embeds `game.html` in an iframe, controls, rating |
| `blog/` | Strategy guides (landing pages for YouTube descriptions) |
| `assets/js/games-data.js` | Game registry. Array order = display priority |
| `assets/js/home.js` | Renders home rows and the `/games/` grid |
| `assets/js/main.js` | Nav, game cards, rating widget |
| `assets/css/style.css` | Design system (light and dark themes) |

## Adding a game

1. Add `games/<slug>/game.html`, `thumbnail.svg` (320x240) and `metadata.json`.
2. Copy `play/max-rampage/index.html` to `play/<slug>/index.html` and update the title, meta, iframe `src`, element IDs and the controls list.
   Add `game-frame-wrap--wide` to the frame wrapper if the game is a fixed 16:9 canvas.
3. Add an entry to `assets/js/games-data.js` with `status: "live"`. Its position in the array sets its order on the site.
4. Add the play page to `sitemap.xml`.

The header and footer are repeated in every page; when changing them, update all `index.html` files and `404.html`.
