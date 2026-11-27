# ShopAtFirstSight

A responsive React + TypeScript prototype for discovering overlooked products from nearby independent shops.

## Run locally

```bash
npm install
npm run dev
```

## Enable live AI product ideas

The expanded product card calls a server-side endpoint when it is deployed on Vercel. Add `OPENAI_API_KEY` to the project's Vercel environment variables, then redeploy. The key stays on the server and is never exposed to the browser.

Until that environment variable is configured, the interface clearly shows a sample idea so the frontend demo remains usable.

## Shopper demo

- Browse a local discovery feed and filter by interest.
- Save or skip products with buttons; touch users can swipe the product card.
- Review saved finds and request pickup using mock interactions.
- See sample shop names, prices, distances, and stock confirmation times.

## Backend integration

Demo inventory is in `src/data.ts`, with its shape in `src/types.ts`. Replace it with the team's inventory API when ready. Saved finds are currently held in component state, and pickup requests are simulated. Stock availability must be confirmed by a shop before a real reservation is made.
