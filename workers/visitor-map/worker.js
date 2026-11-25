/**
 * Self-hosted Cloudflare Worker + D1 backend for jiayisu.com visitor map.
 * Captures accurate edge geolocation (IPv4 & IPv6 via request.cf), OS, Browser,
 * Device, Page/Resource interactions, and per-visitor page trails without storing raw IPs.
 */

const ALLOWED_ORIGINS = new Set([
  "https://jiayisu.com",
  "https://www.jiayisu.com",
  "http://127.0.0.1:4173",
  "http://127.0.0.1:4175",
  "http://localhost:4173",
  "http://localhost:4175"
]);

const BOT_RE = /(bot|spider|crawler|slurp|headless|lighthouse|pingdom|uptime|curl|wget|python-requests|python-urllib|go-http-client|bytespider|ahrefs|semrush|mj12bot|petalbot|bingpreview|facebookexternalhit|twitterbot|Applebot)/i;
const ALLOWED_EVENT_PREFIXES = ["PDF: ", "Download: ", "Paper: ", "BibTeX: ", "Book: "];

function corsHeaders(request) {
  const origin = request.headers.get("Origin") || "";
  const allowOrigin = ALLOWED_ORIGINS.has(origin) ? origin : "https://jiayisu.com";
  return {
    "Access-Control-Allow-Origin": allowOrigin,
    "Access-Control-Allow-Credentials": "true",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Vary": "Origin"
  };
}

function jsonResponse(request, data, status = 200, cacheSeconds = 0) {
  const headers = {
    ...corsHeaders(request),
    "Content-Type": "application/json; charset=utf-8"
  };
  if (cacheSeconds > 0) {
    headers["Cache-Control"] = `public, max-age=${cacheSeconds}`;
  } else {
    headers["Cache-Control"] = "no-store";
  }
  return new Response(JSON.stringify(data), { status, headers });
}

function parseUserAgent(ua, hintPlatform, hintMobile) {
  const s = ua || "";
  const pHint = (hintPlatform || "").replace(/["']/g, "").trim();

  let os = "Other";
  if (/iPhone|iPad|iPod/i.test(s) || /iOS/i.test(pHint)) {
    os = "iOS";
  } else if (/Android/i.test(s) || /Android/i.test(pHint)) {
    os = "Android";
  } else if (/Mac OS X|Macintosh/i.test(s) || /macOS/i.test(pHint)) {
    os = "macOS";
  } else if (/Windows/i.test(s) || /Windows/i.test(pHint)) {
    os = "Windows";
  } else if (/CrOS/i.test(s) || /Chrome\s*OS/i.test(pHint)) {
    os = "ChromeOS";
  } else if (/Linux|X11|Ubuntu|Debian|Fedora/i.test(s) || /Linux/i.test(pHint)) {
    os = "Linux";
  }

  let browser = "Other";
  if (/MicroMessenger/i.test(s)) {
    browser = "WeChat";
  } else if (/EdgA?|EdgiOS/i.test(s)) {
    browser = "Edge";
  } else if (/OPR|Opera/i.test(s)) {
    browser = "Opera";
  } else if (/Firefox|FxiOS/i.test(s)) {
    browser = "Firefox";
  } else if (/Chrome|CriOS/i.test(s)) {
    browser = "Chrome";
  } else if (/Safari/i.test(s)) {
    browser = "Safari";
  }

  let device = "Desktop";
  if (/iPad|Tablet/i.test(s) || (/Android/i.test(s) && !/Mobile/i.test(s))) {
    device = "Tablet";
  } else if (/Mobile|iPhone|iPod|Android/i.test(s) || hintMobile === "?1") {
    device = "Mobile";
  }

  return { os, browser, device };
}

function cleanPage(rawPage) {
  if (!rawPage || typeof rawPage !== "string") return "/";
  // Strip control characters and clamp length
  const sanitized = rawPage.replace(/[\u0000-\u001F\u007F]/g, " ").trim().slice(0, 140);
  if (!sanitized) return "/";
  if (sanitized.startsWith("/")) {
    return sanitized;
  }
  for (const prefix of ALLOWED_EVENT_PREFIXES) {
    if (sanitized.startsWith(prefix)) {
      return sanitized;
    }
  }
  return "/";
}

function cleanReferrer(rawRef) {
  if (!rawRef || typeof rawRef !== "string") return "Direct";
  const trimmed = rawRef.trim();
  if (!trimmed) return "Direct";
  try {
    const u = new URL(trimmed);
    const host = u.hostname.toLowerCase().replace(/^www\./, "");
    if (!host || host === "jiayisu.com" || host === "127.0.0.1" || host === "localhost") {
      return "Direct";
    }
    return host.slice(0, 80);
  } catch {
    return "Direct";
  }
}

async function dailyVisitorHash(ip, ua, dayStr) {
  const bytes = new TextEncoder().encode(`${ip}|${ua}|${dayStr}`);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(digest))
    .slice(0, 8)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

async function handleHit(request, env) {
  const ua = request.headers.get("User-Agent") || "";
  if (!ua || BOT_RE.test(ua)) {
    return jsonResponse(request, { ok: true, ignored: "bot" });
  }

  let body = {};
  try {
    body = await request.json();
  } catch {
    body = {};
  }

  const cf = request.cf || {};
  let country = (cf.country && String(cf.country).trim().toUpperCase()) || "Unknown";
  let region = (cf.region && String(cf.region).trim()) || "";
  const city = (cf.city && String(cf.city).trim()) || "";
  if (country === "TW") {
    country = "CN";
    region = region && !/taiwan/i.test(region) ? `${region}, Taiwan` : "Taiwan";
  }
  const latNum = cf.latitude !== undefined ? Number.parseFloat(cf.latitude) : NaN;
  const lonNum = cf.longitude !== undefined ? Number.parseFloat(cf.longitude) : NaN;
  const lat = Number.isFinite(latNum) ? latNum : null;
  const lon = Number.isFinite(lonNum) ? lonNum : null;
  const asn = Number.isFinite(Number(cf.asn)) ? Number(cf.asn) : null;
  const org = (cf.asOrganization && String(cf.asOrganization).trim().slice(0, 80)) || "";

  const ip = request.headers.get("cf-connecting-ip") || "";
  const ipVersion = ip.includes(":") ? "IPv6" : "IPv4";
  const now = Date.now();
  const dayStr = new Date(now).toISOString().slice(0, 10);
  const visitorHash = await dailyVisitorHash(ip, ua, dayStr);

  const hintPlatform = request.headers.get("Sec-CH-UA-Platform") || "";
  const hintMobile = request.headers.get("Sec-CH-UA-Mobile") || "";
  const { os, browser, device } = parseUserAgent(ua, hintPlatform, hintMobile);

  const page = cleanPage(body.page);
  const referrer = cleanReferrer(body.referrer);

  await env.DB.prepare(
    `INSERT INTO visits (ts, visitor_hash, country, region, city, lat, lon, asn, org, os, browser, device, page, referrer, ip_version)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  )
    .bind(now, visitorHash, country, region, city, lat, lon, asn, org, os, browser, device, page, referrer, ipVersion)
    .run();

  return jsonResponse(request, { ok: true });
}

function buildSessionsFromRows(rowsDesc) {
  const byVisitor = new Map();
  // Walk oldest -> newest so each session builds a clean chronological trail
  const asc = [...rowsDesc].reverse();
  for (const r of asc) {
    const key = r.visitor_hash || `${r.country}-${r.city}-${r.os}-${r.ts}`;
    let sess = byVisitor.get(key);
    if (!sess) {
      sess = {
        firstTs: Number(r.ts),
        lastTs: Number(r.ts),
        country: r.country,
        region: r.region,
        city: r.city,
        os: r.os,
        browser: r.browser,
        device: r.device,
        org: r.org,
        referrer: r.referrer || "Direct",
        ipVersion: r.ipVersion,
        hitCount: 0,
        pages: []
      };
      byVisitor.set(key, sess);
    }
    sess.lastTs = Number(r.ts);
    sess.hitCount += 1;
    if (sess.referrer === "Direct" && r.referrer && r.referrer !== "Direct") {
      sess.referrer = r.referrer;
    }
    if (r.page && sess.pages[sess.pages.length - 1] !== r.page) {
      sess.pages.push(r.page);
    }
  }
  return Array.from(byVisitor.values())
    .sort((a, b) => b.lastTs - a.lastTs)
    .slice(0, 50);
}

async function handleStats(request, env) {
  const totalsRow = await env.DB.prepare(
    `SELECT
       COUNT(*) AS views,
       COUNT(DISTINCT visitor_hash) AS unique_visitors,
       COUNT(DISTINCT CASE WHEN country != 'Unknown' THEN country END) AS countries,
       COUNT(DISTINCT CASE WHEN city != '' AND country != 'Unknown' THEN country || '|' || city END) AS cities,
       MAX(ts) AS latest_ts
     FROM visits`
  ).first();

  const pointsRes = await env.DB.prepare(
    `SELECT
       ROUND(lat, 1) AS lat,
       ROUND(lon, 1) AS lon,
       country,
       MAX(region) AS region,
       MAX(city) AS city,
       COUNT(*) AS count,
       MAX(ts) AS last_ts
     FROM visits
     WHERE lat IS NOT NULL AND lon IS NOT NULL
     GROUP BY ROUND(lat, 1), ROUND(lon, 1), country
     ORDER BY count DESC, last_ts DESC
     LIMIT 250`
  ).all();

  const countriesAllRes = await env.DB.prepare(
    `SELECT country AS label, COUNT(*) AS count
     FROM visits
     GROUP BY country
     ORDER BY count DESC
     LIMIT 200`
  ).all();

  const pagesRes = await env.DB.prepare(
    `SELECT page AS label, COUNT(*) AS count
     FROM visits
     GROUP BY page
     ORDER BY count DESC
     LIMIT 12`
  ).all();

  const osRes = await env.DB.prepare(
    `SELECT os AS label, COUNT(*) AS count
     FROM visits
     GROUP BY os
     ORDER BY count DESC
     LIMIT 8`
  ).all();

  const browserRes = await env.DB.prepare(
    `SELECT browser AS label, COUNT(*) AS count
     FROM visits
     GROUP BY browser
     ORDER BY count DESC
     LIMIT 8`
  ).all();

  const recentRawRes = await env.DB.prepare(
    `SELECT ts, visitor_hash, country, region, city, os, browser, device, org, page, referrer, ip_version AS ipVersion
     FROM visits
     ORDER BY ts DESC
     LIMIT 300`
  ).all();

  const rawRows = recentRawRes.results || [];
  const allCountries = countriesAllRes.results || [];
  const countryTotals = {};
  for (const c of allCountries) {
    if (c.label && c.label !== "Unknown") {
      countryTotals[c.label] = Number(c.count || 0);
    }
  }

  const recent = rawRows.slice(0, 100).map(({ visitor_hash, ...rest }) => rest);
  const sessions = buildSessionsFromRows(rawRows);

  return jsonResponse(
    request,
    {
      totals: {
        views: Number(totalsRow?.views || 0),
        uniqueVisitors: Number(totalsRow?.unique_visitors || 0),
        countries: Number(totalsRow?.countries || 0),
        cities: Number(totalsRow?.cities || 0),
        latestTs: Number(totalsRow?.latest_ts || 0)
      },
      points: pointsRes.results || [],
      countryTotals,
      countryBreakdown: allCountries.slice(0, 8),
      pageBreakdown: pagesRes.results || [],
      osBreakdown: osRes.results || [],
      browserBreakdown: browserRes.results || [],
      recent,
      sessions
    },
    200,
    5
  );
}

export default {
  async fetch(request, env) {
    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: corsHeaders(request) });
    }

    const url = new URL(request.url);
    try {
      if (url.pathname === "/api/health" && request.method === "GET") {
        await env.DB.prepare("SELECT 1").first();
        return jsonResponse(request, { ok: true });
      }
      if (url.pathname === "/api/hit" && request.method === "POST") {
        return await handleHit(request, env);
      }
      if (url.pathname === "/api/stats" && request.method === "GET") {
        return await handleStats(request, env);
      }
      return jsonResponse(request, { error: "Not found" }, 404);
    } catch (err) {
      return jsonResponse(request, { error: err?.message || "Internal error" }, 500);
    }
  }
};
