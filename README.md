# ShopAtFirstSight

Swipe-to-shop for nearby independent businesses. Shoppers discover products that might otherwise be overlooked; shops can improve the visibility of slow-moving, seasonal, near-expiry and one-off stock.

## Run locally

No package installation is required for the frontend demo.

```bash
python3 -m http.server 8080
```

Open `http://localhost:8080` in a browser.

## Shopper experience

- Swipe right to want an item, left to pass it, and up for maybe.
- Click the current product card to expand it and receive a practical AI use idea.
- Save items, place simulated reserve-and-collect holds, and view a grouped pickup route.
- Browse local flash deals, near-expiry rescue items, and community demand campaigns.

## Shop owner experience

- Review item health, demand, holds and estimated pickup revenue.
- Create flash deals, restock items and make bundles from slow-moving inventory.
- Add stock and use the in-app description helper for a draft listing.

## Enable live AI product ideas

When deployed to Vercel, add `OPENAI_API_KEY` in the project environment variables and redeploy. The endpoint at `api/product-suggestions.mjs` sends the request to OpenAI server-side, so the key never reaches the browser.

Without that environment variable the expandable card shows a clearly labelled sample idea, keeping the local frontend demo usable.

## Code layout

- `index.html`: app shell
- `styles.css`: layout and visual styling
- `app.js`: sample data, local browser state, rendering and interactions
- `api/product-suggestions.mjs`: optional server-side AI endpoint for Vercel

The inventory, reservations and swipe analytics are sample data. Replace the `seed()`, `load()` and `save()` functions in `app.js` with backend calls when the data layer is ready.
