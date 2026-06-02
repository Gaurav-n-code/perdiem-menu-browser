# menu-browser

A small multi-location menu browsing app I built on top of Square's Catalog and Locations APIs. The idea is simple: pick a location, browse what's available there right now, tap into an item for the full details.

I used Next.js 15 (App Router), TypeScript, and Tailwind. Square API calls live entirely on the backend — the access token never touches the client.

---

## Getting started

### Prerequisites

- Node.js 20+
- A free Square developer account (sandbox only — setup notes below)

### Install and run

```bash
git clone <your-repo-url>
cd menu-browser
npm install
cp .env.example .env.local   # then fill in your token
npm run dev
```

Open http://localhost:3000. You should see the location dropdown and menu items load in.

---

## Environment variables

```bash
SQUARE_ACCESS_TOKEN=your_sandbox_token_here
SQUARE_ENVIRONMENT=sandbox
```

Copy `.env.example` to `.env.local` and fill in your sandbox token. The `.env.local` file is gitignored — never commit real credentials.

---

## Square sandbox setup

If you're seeing "Failed to load locations" it's almost always a missing or wrong token. Here's the full setup:

**1. Create a developer account**

Go to [developer.squareup.com](https://developer.squareup.com), sign in (or create a free account), and click "Create your first application". Name it anything.

**2. Get your sandbox token**

Inside the app → Credentials tab → scroll to the **Sandbox** section → copy the Sandbox Access Token. It'll start with `EAAAl...`. Paste it into `.env.local` as `SQUARE_ACCESS_TOKEN`.

> Important: make sure you're copying from the **Sandbox** section, not Production. They look identical but using the production token locally is a bad habit even if it works.

**3. Restart the dev server**

Next.js reads `.env.local` at startup. If you added the token after starting the server, stop it (`Ctrl+C`) and run `npm run dev` again.

**4. Verify the token works**

Quick sanity check before debugging further:

```bash
curl https://connect.squareupsandbox.com/v2/locations \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

If you get `{"locations":[...]}` you're good. If you get a 401, the token is wrong.

**5. Seed some data**

You need at least two locations and a handful of items, otherwise the app will load but show empty states.

In the Square sandbox dashboard:
- **Account & Settings → Locations** — create 2 locations, ideally in different timezones
- **Items → Categories** — create 3–4 categories. 
- **Items → Item library** — create 6–10 items. For at least one item, under "Present at locations" choose only one of your two locations — that's what exercises the location filter

---

## Availability (time-of-day BONUS point)

This app supports simple time-of-day availability rules per category. The rules live in `src/config/availability.ts` and are evaluated against the selected location's timezone.

- Items whose category has an availability rule will be marked `availableNow: false` when the current local time at the selected location falls outside the configured window.
- The UI shows an "Unavailable" badge and dims items that are not available right now; the item detail page also surfaces this state.

To experiment with availability, edit `src/config/availability.ts` (e.g. make `Breakfast` include weekends), then reload the app.

---

## Running tests

```bash
npm test
npm run test:watch   # watch mode
```

I wrote focused tests for the two bits of pure logic that matter most: the money formatter (Square returns cents, the formatter has to get it right) and the menu/filter logic that maps Square catalog objects into the app's location-aware menu view.

---

## Architecture decisions and tradeoffs

**Client Component for the home page**

The menu page needs client state for the location switcher and category filter, so it's a Client Component. The cleaner approach would be URL-based state (`?locationId=X&category=Y`) — that would let the initial render happen on the server and make the URL shareable. I went with `useState` to keep it simple, but URL state is the obvious next refactor.

**Service layer**

All Square SDK calls live in `square.service.ts`. Route handlers call the service; nothing else imports from `"square"` directly. It adds a layer, but it means route handlers stay thin, the service is easy to mock in tests, and when Square ships a breaking change I fix it in one place. Worth it.

**Pagination**

`fetchAllCatalogObjects` chases cursors until there are no more. For sandbox data (20–50 objects) this is always one request. For a real merchant with thousands of SKUs you'd want to cache the catalog rather than fetching it on every request — probably keyed by catalog version and invalidated via Square webhooks.

**Multi-variation pricing**

Items with multiple variations (Small / Medium / Large) show the cheapest price. "From $4.50" would communicate this better, but the data model to support it cleanly takes more time than it's worth here. The current version is at least honest.

**Native `<select>` for the location switcher**

I used a native HTML select element instead of a custom dropdown. It's fully accessible out of the box, gets the platform's native picker on mobile, and costs zero JS. You lose visual control but for an MVP that's a fine trade.

**No database**

Per the spec, everything is in-memory. A real version would cache the Square catalog (it doesn't change that often) in Redis or at the CDN edge, keyed by `(merchant_id, location_id, catalog_version)`.

---

## Security notes

- The Square access token lives only in `process.env` on the server. It's never in the client bundle or any API response.
- `locationId` and item `id` path params are validated (length + character allowlist) before being forwarded to Square.
- Square errors are caught server-side and logged there. Clients get a generic error message, not raw Square error codes.
- TypeScript strict mode with `noImplicitAny` — no `any` types anywhere.

---

## What I'd work on next

A few things I'd pick up with more time:

- **URL-based state** — swap `useState` for query params so the menu URL is shareable and the initial load can happen on the server
- **Search** — debounced full-text filter across visible item names and descriptions
- **Inventory** — pull Square's Inventory API to show "sold out" on items that are out of stock
- **Catalog caching** — stop fetching the full catalog on every menu request; cache it at the edge keyed by catalog version, invalidate on Square webhooks
- **Error boundaries** — wrap the menu grid so one broken item card doesn't blank the whole page
- **E2E tests** — Playwright coverage for the location switch flow and the category filter