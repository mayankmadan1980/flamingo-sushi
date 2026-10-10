# Flamingo Sushi

A tap-to-feed race for kids and grown-ups. Anyone with the link types a name and plays. No accounts needed.

- Colourful flamingos are worth 2 points, rare rainbow flamingos are worth 10. First to 100 wins.
- **Kid mode:** big, gentle flamingos.
- **Grown-up mode:** smaller, faster zig-zaggers, plus seagulls that cost 5 points if you tap them.
- Kids and grown-ups have separate "fastest times" leaderboards.
- When several people play at once, everyone sees a live race strip with each player's progress.

## What's in here

| Path | What it does |
|---|---|
| `public/index.html` | The whole game |
| `netlify/functions/scores.mjs` | Saves best times (`/api/scores`) |
| `netlify/functions/race.mjs` | Shows who's playing right now (`/api/race`) |
| `netlify.toml`, `package.json` | Netlify settings |

Scores and live race data are kept in Netlify Blobs, which is built into every Netlify site. Nothing else to set up.

## Put it online

The leaderboard and live race need Netlify to run the two small functions. Netlify's drag-and-drop "Drop" page does **not** run functions, so use one of these instead.

### Option A: GitHub (no installs)

1. Create a new repository on github.com and upload everything in this folder (keep the folder structure).
2. On app.netlify.com choose **Add new project → Import an existing project → GitHub**, then pick the repository.
3. Leave the build settings as they are and click **Deploy**.
4. Optional: under **Project configuration → Change project name**, pick something like `flamingo-sushi-race` so the link is `https://flamingo-sushi-race.netlify.app`.

### Option B: Netlify CLI (if you have Node.js)

```
npm install
npx netlify-cli login
npx netlify-cli deploy --prod
```

Answer "Create & configure a new project" when asked.

## Share it

Post the `https://….netlify.app` link in your WhatsApp group. People open it, type a name, choose Kid or Grown-up, and play.

## Good to know

- Each phone keeps its own best time per name, so two kids on one phone each get their own entry.
- A time faster than 8 seconds is rejected as impossible.
- While someone is playing, each open game checks in every 2.5 seconds (every 10 seconds on the menu, and not at all when the tab is in the background). That is well within Netlify's free plan for a family or friends group. If you share it very widely, keep an eye on usage in the Netlify dashboard.
- To reset the leaderboard, delete the `flamingo-scores` store under **Project → Blobs** in the Netlify dashboard.
