# Jiayi Su — personal academic website

Live site: [jiayisu.com](https://jiayisu.com/)  
Design adapted from [Jon Barron's academic website](https://jonbarron.info/).

## Local preview

From this directory, run:

```bash
python3 -m http.server 4175 --bind 127.0.0.1
```

Open `http://127.0.0.1:4175/` (append `?settled=1` to render the particle portrait settled). Localhost previews never trigger production visitor tracking.

## Structure

- `index.html` & `css/site.css` — Refined Editorial homepage (hero particle portrait, Research Map + interactive 1D Kalman Filter demo, News archive, filterable Publications with 1-click BibTeX copy, 3-column Projects gallery, Links, and Editorial Visitor Map).
- `bookshelf/index.html` — Curated bookshelf (62 technical and non-technical books with topic filters and locally hosted covers).
- `visitors.html` — Full-page world visitor map, OS/Browser/Country breakdown, and recent visit log.
- `workers/visitor-map/` — Self-hosted Cloudflare Workers + D1 telemetry backend resolving both IPv4 and IPv6 locations (`request.cf`) without storing raw IP addresses.
