# Cloudflare Workers + D1 Visitor Map Backend

Self-hosted, zero-cost telemetry backend for `https://jiayisu.com/`.
Uses Cloudflare's edge `request.cf` metadata so **both IPv4 and IPv6** visitors get accurate country/region/city/coordinates along with parsed OS, Browser, Device, Page, and Referrer — without storing raw visitor IP addresses.

## Option A — Pure Web Dashboard Setup (~5 min, no CLI required)

1. Sign in to the [Cloudflare Dashboard](https://dash.cloudflare.com/) (free plan works).
2. Create the D1 database: **Storage & Databases → D1 SQL Database → Create** (name: `jiayi-visitors`).
3. Open **Console** inside `jiayi-visitors` and paste/execute the SQL in `schema.sql`.
4. Go to **Compute (Workers & Pages) → Create → Start with Hello World!** (name: `jiayi-visitors`), click **Edit Code**, replace `worker.js` with the contents of `workers/visitor-map/worker.js`, and **Deploy**.
5. In the Worker's **Settings → Bindings → Add → D1 Database**, set Variable name = `DB`, choose `jiayi-visitors`, and **Save**.
6. Copy the Worker URL (e.g., `https://jiayi-visitors.<your-subdomain>.workers.dev`), paste it into `VISITOR_API` at the top of `js/visitor-map.js`, commit, and push.

## Option B — Wrangler CLI Setup

```bash
cd workers/visitor-map
npx wrangler d1 create jiayi-visitors
# Copy database_id into wrangler.toml
npx wrangler d1 execute jiayi-visitors --remote --file=./schema.sql
npx wrangler deploy
```

## Verify Deployment

```bash
curl -s https://jiayi-visitors.<your-subdomain>.workers.dev/api/health
curl -s https://jiayi-visitors.<your-subdomain>.workers.dev/api/stats
```
