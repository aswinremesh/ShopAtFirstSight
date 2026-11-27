# ShopAtFirstSight (Little Finds)

Swipe-to-shop for independent local shops. Shoppers swipe through nearby products, and shops use it to sell slow-moving, seasonal and one-off stock, and to test demand before ordering something new.

## Run locally

No build step or API key needed. Serve the folder and open it:

```bash
python3 -m http.server 8080
```

Then visit http://localhost:8080. (Opening `index.html` directly also works.)

## Shopper features

- **Swipe feed**: drag right to *want*, left to *pass*, up for *maybe*. Arrow keys work too, and Z undoes the last swipe.
- **Smart ranking with "Why am I seeing this?"**: cards are ranked by interests, what you've wanted before, deals, low stock, distance and hidden-gem status, with a small daily shuffle.
- **Tune your feed**: pick interests and set a budget and a radius.
- **Daily local drop**: 15 finds a day, with an "explorer mode" to keep going. Items you passed come back the next day.
- **Wanted and Maybe lists**: price-drop badges, a share-list button, and a one-tap move from Maybe to Wanted.
- **Reserve and collect**: hold an item for 30 or 60 minutes and pay in store. Stock goes down while the hold is live and comes back if the hold expires or is cancelled.
- **Pickup route**: a map that groups your holds into one walking trip, with countdown timers.
- **Flash deals and near-expiry rescue**: countdown badges, best-before labels and surprise bags.
- **Bring it in**: vote on products a shop is thinking of stocking. When a campaign hits its target, the shop orders it and voters get first access.
- **Neighbourhood trail**: points, levels, shop stamps and a €5 voucher. Members-only prices unlock at 100 points.
- **Notifications**: price drops on saved items, a warning 10 minutes before a hold expires, and Bring-it-in news.

## Shop owner dashboard

Switch to **Shop owner** in the header.

- KPIs: views, wants, maybes, reservations, collected, and view-to-hold rate.
- Stock health for each item (New / Steady / Warm / Slow mover / Selling fast) with suggestions, plus one-click **⚡ 20% off for 3h** and **+5 restock** buttons.
- **Bundle slow movers**: combines slow stock into a discounted bundle that goes straight onto the feed.
- **Quick add stock**: price, quantity, clearance discount and how long it runs, best-before date, visibility (everyone / members / quiet clearance), a shopkeeper note, and an auto-written description.
- **Demand insights**: anonymous wants by category, the average price of wanted vs passed items, and how well bundles convert.
- **Bring it in campaigns**: create a demand test and watch the votes come in.

## Code layout

- `index.html`: the app shell
- `styles.css`: styles
- `app.js`: seed data, state (saved in `localStorage`), feed ranking, rendering and actions

## Backend integration

Replace `seed()` / `load()` / `save()` in `app.js` with API calls. Products, campaigns, reservations and swipe stats are plain objects, ready to map to endpoints. Holds, pickups and the "Collected" confirmation are simulated in this prototype.
