(function () {
  "use strict";

  var VISITOR_API = "https://jiayi-visitors.sujiayinx1993.workers.dev";

  var HOST = window.location.hostname;
  var IS_PROD = HOST === "jiayisu.com" || HOST === "www.jiayisu.com";
  var FORCE_LIVE_MAP = /[?&]live-map=1\b/.test(window.location.search);
  var FORCE_DEMO_MAP = /[?&]demo-map=1\b/.test(window.location.search);

  var SVG_NS = "http://www.w3.org/2000/svg";

  function escapeHtml(str) {
    return String(str == null ? "" : str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function normalizeGeo(country, region, city) {
    var c = String(country || "").trim();
    var r = String(region || "").trim();
    var ct = String(city || "").trim();
    if (c.toUpperCase() === "TW" || /^taiwan$/i.test(c)) {
      c = "CN";
      if (!r) {
        r = "Taiwan";
      } else if (!/taiwan/i.test(r)) {
        r = r + ", Taiwan";
      }
    }
    return { country: c || "Unknown", region: r, city: ct };
  }

  function formatCountry(code) {
    if (!code || code === "Unknown") return "Unknown";
    if (String(code).toUpperCase() === "CN" || String(code).toUpperCase() === "TW") return "China";
    if (code.length === 2 && window.Intl && Intl.DisplayNames) {
      try {
        var dn = new Intl.DisplayNames(["en"], { type: "region" });
        return dn.of(code.toUpperCase()) || code;
      } catch (e) {}
    }
    return code;
  }

  function formatLocation(city, region, country) {
    var geo = normalizeGeo(country, region, city);
    var parts = [];
    if (geo.city) parts.push(geo.city);
    if (geo.region && geo.region !== geo.city) parts.push(geo.region);
    var c = formatCountry(geo.country);
    if (c && c !== "Unknown") parts.push(c);
    return parts.length ? parts.join(", ") : "Unknown location";
  }

  function formatPageLabel(raw) {
    if (!raw || raw === "/") return "Homepage (/)";
    if (raw === "/bookshelf/" || raw === "/bookshelf/index.html") return "Bookshelf (/bookshelf/)";
    if (raw === "/resume.html") return "Resume (/resume.html)";
    if (raw === "/visitors.html") return "Visitors (/visitors.html)";
    if (raw.indexOf("/go.html?f=") === 0) {
      return "Note: " + raw.replace("/go.html?f=", "");
    }
    return raw;
  }

  function formatRelativeTime(ts) {
    if (!ts) return "—";
    var diff = Math.max(0, Date.now() - Number(ts));
    var mins = Math.floor(diff / 60000);
    if (mins < 1) return "just now";
    if (mins < 60) return mins + "m ago";
    var hrs = Math.floor(mins / 60);
    if (hrs < 24) return hrs + "h ago";
    var days = Math.floor(hrs / 24);
    if (days < 30) return days + "d ago";
    try {
      return new Date(Number(ts)).toISOString().slice(0, 10);
    } catch (e) {
      return "—";
    }
  }

  function formatClock(ts) {
    if (!ts) return "—";
    try {
      return new Date(Number(ts)).toLocaleString("en-US", {
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        hour12: false
      });
    } catch (e) {
      return "—";
    }
  }

  function derivePageBreakdown(recent) {
    var counts = {};
    (recent || []).forEach(function (r) {
      var p = r.page || "/";
      counts[p] = (counts[p] || 0) + 1;
    });
    return Object.keys(counts)
      .map(function (k) { return { label: k, count: counts[k] }; })
      .sort(function (a, b) { return b.count - a.count; })
      .slice(0, 12);
  }

  function deriveCountryTotals(data) {
    var map = {};
    var src = (data.countryTotals && typeof data.countryTotals === "object") ? data.countryTotals : null;
    if (src) {
      Object.keys(src).forEach(function (k) {
        var norm = normalizeGeo(k).country;
        if (norm && norm !== "Unknown") {
          map[norm] = (map[norm] || 0) + Number(src[k] || 0);
        }
      });
      return map;
    }
    (data.countryBreakdown || []).forEach(function (c) {
      var norm = normalizeGeo(c.label).country;
      if (norm && norm !== "Unknown") {
        map[norm] = (map[norm] || 0) + Number(c.count || 0);
      }
    });
    return map;
  }

  function normalizeCountryBreakdown(items) {
    var map = {};
    (items || []).forEach(function (c) {
      var norm = normalizeGeo(c.label).country;
      map[norm] = (map[norm] || 0) + Number(c.count || 0);
    });
    return Object.keys(map)
      .map(function (k) { return { label: k, count: map[k] }; })
      .sort(function (a, b) { return b.count - a.count; })
      .slice(0, 8);
  }

  function deriveSessions(recent) {
    var byKey = {};
    var asc = (recent || []).slice().reverse();
    asc.forEach(function (r) {
      var k = [r.country, r.city, r.os, r.browser, r.org].join("|");
      if (!byKey[k]) {
        byKey[k] = {
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
          ipVersion: r.ipVersion || "IPv4",
          hitCount: 0,
          pages: []
        };
      }
      var s = byKey[k];
      s.lastTs = Number(r.ts);
      s.hitCount += 1;
      if (r.page && s.pages[s.pages.length - 1] !== r.page) {
        s.pages.push(r.page);
      }
    });
    return Object.keys(byKey)
      .map(function (k) { return byKey[k]; })
      .sort(function (a, b) { return b.lastTs - a.lastTs; });
  }

  function buildDemoData() {
    var now = Date.now();
    return {
      isDemo: true,
      totals: {
        views: 248,
        uniqueVisitors: 164,
        countries: 15,
        cities: 28,
        latestTs: now - 4 * 60000
      },
      countryTotals: {
        US: 90, CN: 48, GB: 19, JP: 17, SG: 15, CA: 14, DE: 12, CH: 11, KR: 10, AU: 9, IN: 5, BR: 4, FR: 6, NL: 5, SE: 3
      },
      points: [
        { lat: 43.0, lon: -87.9, country: "US", region: "Wisconsin", city: "Milwaukee", count: 48, last_ts: now - 4 * 60000 },
        { lat: 30.6, lon: 114.3, country: "CN", region: "Hubei", city: "Wuhan", count: 48, last_ts: now - 22 * 60000 },
        { lat: 37.3, lon: -121.9, country: "US", region: "California", city: "San Jose", count: 29, last_ts: now - 58 * 60000 },
        { lat: 51.5, lon: -0.1, country: "GB", region: "England", city: "London", count: 19, last_ts: now - 140 * 60000 },
        { lat: 35.7, lon: 139.7, country: "JP", region: "Tokyo", city: "Tokyo", count: 17, last_ts: now - 260 * 60000 },
        { lat: 1.3, lon: 103.8, country: "SG", region: "Central", city: "Singapore", count: 15, last_ts: now - 390 * 60000 },
        { lat: 47.4, lon: 8.5, country: "CH", region: "Zurich", city: "Zurich", count: 11, last_ts: now - 620 * 60000 },
        { lat: 43.7, lon: -79.4, country: "CA", region: "Ontario", city: "Toronto", count: 14, last_ts: now - 780 * 60000 },
        { lat: 48.1, lon: 11.6, country: "DE", region: "Bavaria", city: "Munich", count: 12, last_ts: now - 950 * 60000 },
        { lat: -37.8, lon: 145.0, country: "AU", region: "Victoria", city: "Melbourne", count: 9, last_ts: now - 1220 * 60000 },
        { lat: 37.5, lon: 127.0, country: "KR", region: "Seoul", city: "Seoul", count: 10, last_ts: now - 1540 * 60000 },
        { lat: 42.3, lon: -71.1, country: "US", region: "Massachusetts", city: "Cambridge", count: 13, last_ts: now - 1900 * 60000 },
        { lat: -23.5, lon: -46.6, country: "BR", region: "Sao Paulo", city: "Sao Paulo", count: 4, last_ts: now - 2800 * 60000 },
        { lat: 28.6, lon: 77.2, country: "IN", region: "Delhi", city: "New Delhi", count: 5, last_ts: now - 3400 * 60000 },
        { lat: 48.8, lon: 2.3, country: "FR", region: "Ile-de-France", city: "Paris", count: 6, last_ts: now - 3900 * 60000 }
      ],
      countryBreakdown: [
        { label: "US", count: 90 },
        { label: "CN", count: 48 },
        { label: "GB", count: 19 },
        { label: "JP", count: 17 },
        { label: "SG", count: 15 },
        { label: "CA", count: 14 },
        { label: "DE", count: 12 },
        { label: "CH", count: 11 }
      ],
      pageBreakdown: [
        { label: "/", count: 138 },
        { label: "/bookshelf/", count: 42 },
        { label: "/resume.html", count: 29 },
        { label: "Download: jiayi_resume_v3.pdf", count: 14 },
        { label: "PDF: red_ord_kf.pdf", count: 11 },
        { label: "BibTeX: su2026awtls", count: 8 },
        { label: "Paper: IECON 2026 — Voltage-Strain Fusion...", count: 6 }
      ],
      osBreakdown: [
        { label: "macOS", count: 102 },
        { label: "Windows", count: 64 },
        { label: "iOS", count: 43 },
        { label: "Linux", count: 24 },
        { label: "Android", count: 15 }
      ],
      browserBreakdown: [
        { label: "Chrome", count: 136 },
        { label: "Safari", count: 64 },
        { label: "Edge", count: 22 },
        { label: "Firefox", count: 18 },
        { label: "WeChat", count: 8 }
      ],
      sessions: [
        {
          firstTs: now - 7 * 60000,
          lastTs: now - 4 * 60000,
          country: "US", region: "Wisconsin", city: "Milwaukee",
          os: "macOS", browser: "Safari", device: "Desktop",
          org: "Marquette University", referrer: "scholar.google.com", ipVersion: "IPv6", hitCount: 3,
          pages: ["/", "/resume.html", "Download: jiayi_resume_v3.pdf"]
        },
        {
          firstTs: now - 26 * 60000,
          lastTs: now - 22 * 60000,
          country: "CN", region: "Hubei", city: "Wuhan",
          os: "Windows", browser: "Chrome", device: "Desktop",
          org: "China Telecom", referrer: "Direct", ipVersion: "IPv6", hitCount: 3,
          pages: ["/", "/bookshelf/", "Book: Seeing Like a State"]
        },
        {
          firstTs: now - 61 * 60000,
          lastTs: now - 58 * 60000,
          country: "US", region: "California", city: "San Jose",
          os: "iOS", browser: "Safari", device: "Mobile",
          org: "AT&T Mobility", referrer: "github.com", ipVersion: "IPv6", hitCount: 2,
          pages: ["/", "PDF: red_ord_kf.pdf"]
        },
        {
          firstTs: now - 145 * 60000,
          lastTs: now - 140 * 60000,
          country: "GB", region: "England", city: "London",
          os: "macOS", browser: "Chrome", device: "Desktop",
          org: "Imperial College London", referrer: "ieeexplore.ieee.org", ipVersion: "IPv4", hitCount: 2,
          pages: ["/", "BibTeX: su2026awtls"]
        },
        {
          firstTs: now - 260 * 60000,
          lastTs: now - 260 * 60000,
          country: "JP", region: "Tokyo", city: "Tokyo",
          os: "Linux", browser: "Firefox", device: "Desktop",
          org: "University of Tokyo", referrer: "Direct", ipVersion: "IPv6", hitCount: 1,
          pages: ["/"]
        },
        {
          firstTs: now - 395 * 60000,
          lastTs: now - 390 * 60000,
          country: "SG", region: "Central", city: "Singapore",
          os: "macOS", browser: "Chrome", device: "Desktop",
          org: "National Univ. of Singapore", referrer: "google.com", ipVersion: "IPv4", hitCount: 2,
          pages: ["/bookshelf/", "Book: Optimal State Estimation"]
        }
      ],
      recent: [
        { ts: now - 4 * 60000, country: "US", region: "Wisconsin", city: "Milwaukee", os: "macOS", browser: "Safari", device: "Desktop", org: "Marquette University", page: "Download: jiayi_resume_v3.pdf", referrer: "scholar.google.com", ipVersion: "IPv6" },
        { ts: now - 5 * 60000, country: "US", region: "Wisconsin", city: "Milwaukee", os: "macOS", browser: "Safari", device: "Desktop", org: "Marquette University", page: "/resume.html", referrer: "scholar.google.com", ipVersion: "IPv6" },
        { ts: now - 7 * 60000, country: "US", region: "Wisconsin", city: "Milwaukee", os: "macOS", browser: "Safari", device: "Desktop", org: "Marquette University", page: "/", referrer: "scholar.google.com", ipVersion: "IPv6" },
        { ts: now - 22 * 60000, country: "CN", region: "Hubei", city: "Wuhan", os: "Windows", browser: "Chrome", device: "Desktop", org: "China Telecom", page: "Book: Seeing Like a State", referrer: "Direct", ipVersion: "IPv6" },
        { ts: now - 24 * 60000, country: "CN", region: "Hubei", city: "Wuhan", os: "Windows", browser: "Chrome", device: "Desktop", org: "China Telecom", page: "/bookshelf/", referrer: "Direct", ipVersion: "IPv6" },
        { ts: now - 58 * 60000, country: "US", region: "California", city: "San Jose", os: "iOS", browser: "Safari", device: "Mobile", org: "AT&T Mobility", page: "PDF: red_ord_kf.pdf", referrer: "github.com", ipVersion: "IPv6" },
        { ts: now - 140 * 60000, country: "GB", region: "England", city: "London", os: "macOS", browser: "Chrome", device: "Desktop", org: "Imperial College London", page: "BibTeX: su2026awtls", referrer: "ieeexplore.ieee.org", ipVersion: "IPv4" },
        { ts: now - 390 * 60000, country: "SG", region: "Central", city: "Singapore", os: "macOS", browser: "Chrome", device: "Desktop", org: "National Univ. of Singapore", page: "/bookshelf/", referrer: "google.com", ipVersion: "IPv4" }
      ]
    };
  }

  function fetchVisitorStats() {
    var apiBase = VISITOR_API.replace(/\/+$/, "");
    if (!apiBase || FORCE_DEMO_MAP) {
      return Promise.resolve(buildDemoData());
    }
    var url = apiBase + "/api/stats" + (IS_PROD ? "?_=" + Date.now() : "");
    return fetch(url, { method: "GET", credentials: "omit", cache: IS_PROD ? "no-store" : "default" })
      .then(function (resp) {
        if (!resp.ok) throw new Error("HTTP " + resp.status);
        return resp.json();
      })
      .then(function (data) {
        data.isDemo = false;
        return data;
      });
  }

  function sendHit(pageLabel) {
    var apiBase = VISITOR_API.replace(/\/+$/, "");
    if (!apiBase || !IS_PROD || navigator.webdriver) return Promise.resolve();
    var payload = JSON.stringify({
      page: pageLabel,
      referrer: document.referrer || ""
    });
    try {
      // text/plain + credentials: omit is a CORS simple request (no OPTIONS preflight),
      // avoiding Safari/Chrome sendBeacon credential restrictions. Worker still parses JSON.
      return fetch(apiBase + "/api/hit", {
        method: "POST",
        headers: { "Content-Type": "text/plain;charset=UTF-8" },
        body: payload,
        keepalive: true,
        credentials: "omit"
      }).catch(function () {});
    } catch (e) {
      return Promise.resolve();
    }
  }

  function recordVisit() {
    var path = window.location.pathname || "/";
    if (/go\.html$/i.test(path) && window.location.search) {
      path += window.location.search;
    }
    return sendHit(path);
  }

  function initClickTracking() {
    var apiBase = VISITOR_API.replace(/\/+$/, "");
    if (!apiBase || !IS_PROD || navigator.webdriver) return;

    document.addEventListener("click", function (event) {
      var bib = event.target.closest && event.target.closest("[data-bibtex]");
      if (bib) {
        sendHit("BibTeX: " + (bib.getAttribute("data-bibtex") || "citation"));
        return;
      }

      var link = event.target.closest && event.target.closest("a[href]");
      if (!link) return;
      var href = link.getAttribute("href") || "";

      if (link.hasAttribute("download") || /\.pdf($|\?)/i.test(href)) {
        var fname = href.split("?")[0].split("/").pop() || "document.pdf";
        var prefix = link.hasAttribute("download") ? "Download: " : "PDF: ";
        sendHit((prefix + fname).slice(0, 120));
        return;
      }

      if (link.closest(".pub-links")) {
        var card = link.closest(".pub-card");
        var pubTitle = card && card.querySelector(".pub-title") ? card.querySelector(".pub-title").textContent.trim() : "";
        var shortTitle = pubTitle.length > 44 ? pubTitle.slice(0, 44).trim() + "..." : pubTitle;
        var act = link.textContent.trim();
        sendHit(("Paper: " + (shortTitle || act) + " (" + act + ")").slice(0, 120));
        return;
      }

      if (link.closest(".book-card")) {
        var bcard = link.closest(".book-card");
        var btitle = bcard && bcard.querySelector(".book-title") ? bcard.querySelector(".book-title").textContent.trim() : "";
        var bshort = btitle.length > 52 ? btitle.slice(0, 52).trim() + "..." : btitle;
        if (bshort) sendHit(("Book: " + bshort).slice(0, 120));
      }
    });
  }

  function projectPoint(lat, lon) {
    var clampedLat = Math.max(-59.5, Math.min(85, Number(lat)));
    var clampedLon = Math.max(-180, Math.min(180, Number(lon)));
    return {
      x: ((clampedLon + 180) / 360) * 1000,
      y: ((90 - clampedLat) / 180) * 500
    };
  }

  function countryTierClass(count) {
    if (!count || count <= 0) return "";
    if (count >= 20) return " is-visited tier-3";
    if (count >= 5) return " is-visited tier-2";
    return " is-visited tier-1";
  }

  function renderWorldSvg(mountEl, points, countryTotals, options) {
    if (!mountEl) return;
    options = options || {};
    mountEl.innerHTML = "";

    var wrap = document.createElement("div");
    wrap.className = "editorial-map-wrap";

    var svg = document.createElementNS(SVG_NS, "svg");
    svg.setAttribute("class", "editorial-map-svg");
    svg.setAttribute("viewBox", "0 16 1000 416");
    svg.setAttribute("role", "img");
    svg.setAttribute("aria-label", "World visitor choropleth and location map");

    var tooltip = document.createElement("div");
    tooltip.className = "map-tooltip";
    tooltip.setAttribute("hidden", "");

    function positionTooltip(cx, cy) {
      var wrapRect = wrap.getBoundingClientRect();
      var left = Math.min(Math.max(12, cx - wrapRect.left + 12), Math.max(12, wrapRect.width - 220));
      var top = Math.max(8, cy - wrapRect.top - 48);
      tooltip.style.left = left + "px";
      tooltip.style.top = top + "px";
    }

    function showTooltip(title, sub, cx, cy) {
      tooltip.innerHTML = "<strong>" + escapeHtml(title) + "</strong><span>" + escapeHtml(sub) + "</span>";
      tooltip.removeAttribute("hidden");
      positionTooltip(cx, cy);
    }

    function hideTooltip() {
      tooltip.setAttribute("hidden", "");
    }

    // Equirectangular graticule grid (lat 30N, Equator, 30S; lon -90, 0, +90)
    var gratGroup = document.createElementNS(SVG_NS, "g");
    gratGroup.setAttribute("class", "map-graticule");
    [166.7, 250, 333.3].forEach(function (y) {
      var line = document.createElementNS(SVG_NS, "line");
      line.setAttribute("x1", "0");
      line.setAttribute("x2", "1000");
      line.setAttribute("y1", String(y));
      line.setAttribute("y2", String(y));
      gratGroup.appendChild(line);
    });
    [250, 500, 750].forEach(function (x) {
      var line = document.createElementNS(SVG_NS, "line");
      line.setAttribute("x1", String(x));
      line.setAttribute("x2", String(x));
      line.setAttribute("y1", "16");
      line.setAttribute("y2", "432");
      gratGroup.appendChild(line);
    });
    svg.appendChild(gratGroup);

    // Country polygons with choropleth shading and clean borders
    var landGroup = document.createElementNS(SVG_NS, "g");
    landGroup.setAttribute("class", "map-land");
    var countries = Array.isArray(window.WORLD_COUNTRIES) ? window.WORLD_COUNTRIES : [];
    var cMap = countryTotals || {};

    countries.forEach(function (ctry) {
      var cnt = Number(cMap[ctry.c] || 0);
      var path = document.createElementNS(SVG_NS, "path");
      path.setAttribute("d", ctry.d);
      path.setAttribute("class", "map-country" + countryTierClass(cnt));
      path.addEventListener("pointerenter", function (ev) {
        showTooltip(ctry.n, cnt > 0 ? cnt + (cnt === 1 ? " visit" : " visits") : "No visits yet", ev.clientX, ev.clientY);
      });
      path.addEventListener("pointermove", function (ev) {
        positionTooltip(ev.clientX, ev.clientY);
      });
      path.addEventListener("pointerleave", hideTooltip);
      landGroup.appendChild(path);
    });
    svg.appendChild(landGroup);

    // Determine newest timestamp to highlight latest location with animated terracotta pulse
    var latestTs = 0;
    (points || []).forEach(function (pt) {
      var t = Number(pt.last_ts || pt.lastTs || 0);
      if (t > latestTs) latestTs = t;
    });

    var dotsGroup = document.createElementNS(SVG_NS, "g");
    dotsGroup.setAttribute("class", "map-dots");

    (points || []).forEach(function (pt) {
      if (pt.lat == null || pt.lon == null) return;
      var pos = projectPoint(pt.lat, pt.lon);
      var count = Math.max(1, Number(pt.count || 1));
      var baseR = options.compact ? 4.0 : 4.6;
      var radius = Math.min(options.compact ? 10.5 : 12.5, baseR + Math.sqrt(count) * 0.85);
      var isLatest = latestTs > 0 && Number(pt.last_ts || pt.lastTs || 0) === latestTs;

      if (isLatest) {
        var pulse = document.createElementNS(SVG_NS, "circle");
        pulse.setAttribute("class", "map-dot-pulse");
        pulse.setAttribute("cx", pos.x.toFixed(1));
        pulse.setAttribute("cy", pos.y.toFixed(1));
        pulse.setAttribute("r", (radius + 6).toFixed(1));
        dotsGroup.appendChild(pulse);

        var halo = document.createElementNS(SVG_NS, "circle");
        halo.setAttribute("class", "map-dot-halo");
        halo.setAttribute("cx", pos.x.toFixed(1));
        halo.setAttribute("cy", pos.y.toFixed(1));
        halo.setAttribute("r", (radius + 4).toFixed(1));
        dotsGroup.appendChild(halo);
      }

      var circle = document.createElementNS(SVG_NS, "circle");
      circle.setAttribute("class", "map-dot" + (isLatest ? " is-latest" : ""));
      circle.setAttribute("cx", pos.x.toFixed(1));
      circle.setAttribute("cy", pos.y.toFixed(1));
      circle.setAttribute("r", radius.toFixed(1));
      circle.setAttribute("tabindex", "0");
      var loc = formatLocation(pt.city, pt.region, pt.country);
      var sub = count + (count === 1 ? " visit" : " visits") + " · " + formatRelativeTime(pt.last_ts || pt.lastTs);
      circle.setAttribute("aria-label", loc + ": " + sub);

      circle.addEventListener("pointerenter", function (ev) {
        ev.stopPropagation();
        showTooltip(loc, sub, ev.clientX, ev.clientY);
      });
      circle.addEventListener("pointermove", function (ev) {
        positionTooltip(ev.clientX, ev.clientY);
      });
      circle.addEventListener("pointerleave", hideTooltip);
      circle.addEventListener("focus", function () {
        var r = circle.getBoundingClientRect();
        showTooltip(loc, sub, r.left + r.width / 2, r.top);
      });
      circle.addEventListener("blur", hideTooltip);

      dotsGroup.appendChild(circle);
    });

    svg.appendChild(dotsGroup);
    wrap.appendChild(svg);
    wrap.appendChild(tooltip);
    mountEl.appendChild(wrap);
  }

  function injectLegacyMapMyVisitors(container, src) {
    if (!container || !src || container.querySelector("#mapmyvisitors")) return;
    container.innerHTML = "";
    var script = document.createElement("script");
    script.async = true;
    script.id = "mapmyvisitors";
    script.src = src;
    container.appendChild(script);
  }

  function initHomeVisitorWidget() {
    var container = document.querySelector("[data-visitor-map-widget]");
    if (!container) return;

    var apiBase = VISITOR_API.replace(/\/+$/, "");
    var legacySrc = container.getAttribute("data-mapmyvisitors-src");

    if (!apiBase && IS_PROD && !FORCE_DEMO_MAP) {
      injectLegacyMapMyVisitors(container, legacySrc);
      return;
    }
    if (FORCE_LIVE_MAP && legacySrc && !apiBase) {
      injectLegacyMapMyVisitors(container, legacySrc);
      return;
    }

    var mapHost = document.createElement("div");
    mapHost.className = "editorial-map-host editorial-map-clickable";
    mapHost.title = "Open full visitor dashboard";
    mapHost.addEventListener("click", function (ev) {
      if (ev.target && ev.target.closest("a")) return;
      var suffix = FORCE_DEMO_MAP ? "?demo-map=1" : "";
      window.location.href = "visitors.html" + suffix;
    });

    var footerBar = document.createElement("div");
    footerBar.className = "visitor-map-meta";
    container.innerHTML = "";
    container.appendChild(mapHost);
    container.appendChild(footerBar);

    fetchVisitorStats()
      .then(function (data) {
        renderWorldSvg(mapHost, data.points || [], deriveCountryTotals(data), { compact: true });
        var t = data.totals || {};
        var badge = data.isDemo
          ? '<span class="visitor-preview-badge">Sample Preview (?demo-map=1)</span>'
          : '<span class="visitor-live-badge"><span class="live-pulse"></span>Live Edge Analytics (IPv4 &amp; IPv6)</span>';
        footerBar.innerHTML =
          '<div class="visitor-kpis-inline">' +
          "<span><strong>" + Number(t.views || 0).toLocaleString() + "</strong> views</span>" +
          "<span><strong>" + Number(t.countries || 0).toLocaleString() + "</strong> countries</span>" +
          "<span><strong>" + Number(t.cities || 0).toLocaleString() + "</strong> cities</span>" +
          "</div>" +
          badge;
      })
      .catch(function () {
        if (legacySrc && IS_PROD) {
          injectLegacyMapMyVisitors(container, legacySrc);
        } else {
          var fallback = buildDemoData();
          renderWorldSvg(mapHost, fallback.points, fallback.countryTotals, { compact: true });
          footerBar.innerHTML = '<span class="visitor-preview-badge">Analytics endpoint unavailable · showing preview</span>';
        }
      });
  }

  function renderBreakdown(mountId, items, formatter) {
    var el = document.getElementById(mountId);
    if (!el) return;
    if (!items || !items.length) {
      el.innerHTML = '<p class="dash-empty">No visits recorded yet.</p>';
      return;
    }
    var max = Math.max.apply(null, items.map(function (it) { return Number(it.count || 0); })) || 1;
    el.innerHTML = items
      .map(function (it) {
        var label = formatter ? formatter(it.label) : (it.label || "Unknown");
        var cnt = Number(it.count || 0);
        var pct = Math.max(4, Math.round((cnt / max) * 100));
        return (
          '<div class="bar-row">' +
          '<div class="bar-label-line"><span title="' + escapeHtml(label) + '">' + escapeHtml(label) + "</span><strong>" + cnt.toLocaleString() + "</strong></div>" +
          '<div class="bar-track"><div class="bar-fill" style="width:' + pct + '%"></div></div>' +
          "</div>"
        );
      })
      .join("");
  }

  function pageBadgeClass(p) {
    if (!p || p === "/") return "trail-pill trail-pill--home";
    if (p.indexOf("Download:") === 0 || p.indexOf("PDF:") === 0) return "trail-pill trail-pill--doc";
    if (p.indexOf("/resume") === 0) return "trail-pill trail-pill--doc";
    return "trail-pill";
  }

  function initVisitorDashboard() {
    var root = document.querySelector("[data-visitor-dashboard]");
    if (!root) return;

    var mapHost = document.getElementById("dash-map");
    var banner = document.getElementById("dash-mode-banner");
    var searchInput = document.getElementById("dash-search");
    var thead = document.getElementById("dash-table-head");
    var tbody = document.getElementById("dash-table-body");
    var countLabel = document.getElementById("dash-row-count");
    var tabButtons = Array.prototype.slice.call(document.querySelectorAll("[data-dash-tab]"));

    var activeTab = "sessions";
    var cachedSessions = [];
    var cachedRecent = [];

    function renderActivity() {
      if (!tbody || !thead) return;
      var q = (searchInput && searchInput.value ? searchInput.value : "").trim().toLowerCase();

      if (activeTab === "sessions") {
        thead.innerHTML =
          "<tr><th>Last Seen</th><th>Location</th><th>Pages &amp; Resources Viewed</th><th>OS &amp; Browser</th><th>Network / ASN</th><th>Referrer</th><th>IP</th></tr>";

        var filteredSess = !q
          ? cachedSessions
          : cachedSessions.filter(function (s) {
              var hay = [
                formatLocation(s.city, s.region, s.country),
                s.os, s.browser, s.org, s.referrer, s.ipVersion,
                (s.pages || []).join(" ")
              ].join(" ").toLowerCase();
              return hay.indexOf(q) !== -1;
            });

        if (countLabel) {
          countLabel.textContent = "Showing " + filteredSess.length + " of " + cachedSessions.length + " recent visitors";
        }
        if (!filteredSess.length) {
          var emptyMsg = cachedSessions.length === 0
            ? "No visitors recorded yet — visits &amp; page trails will appear automatically once live on jiayisu.com."
            : "No matching visitors found.";
          tbody.innerHTML = '<tr><td colspan="7" class="dash-empty-cell">' + emptyMsg + "</td></tr>";
          return;
        }
        tbody.innerHTML = filteredSess
          .map(function (s) {
            var loc = formatLocation(s.city, s.region, s.country);
            var client = [s.os || "Other", s.browser || "Other"].join(" · ");
            var protoClass = s.ipVersion === "IPv6" ? "proto-badge proto-badge--v6" : "proto-badge";
            var trailHtml = (s.pages && s.pages.length ? s.pages : ["/"])
              .map(function (p) {
                return '<span class="' + pageBadgeClass(p) + '">' + escapeHtml(formatPageLabel(p)) + "</span>";
              })
              .join('<span class="trail-sep">→</span>');
            return (
              "<tr>" +
              '<td class="mono-cell cell-time" data-label="Last Seen" title="' + escapeHtml(formatClock(s.lastTs)) + '">' + escapeHtml(formatRelativeTime(s.lastTs)) + "</td>" +
              '<td class="cell-loc" data-label="Location"><strong>' + escapeHtml(loc) + "</strong></td>" +
              '<td class="cell-trail" data-label="Pages"><div class="trail-pills">' + trailHtml + "</div></td>" +
              '<td class="cell-client" data-label="Client">' + escapeHtml(client) + ' <span class="device-tag">' + escapeHtml(s.device || "Desktop") + "</span></td>" +
              '<td class="muted-cell cell-org" data-label="Network">' + escapeHtml(s.org || "—") + "</td>" +
              '<td class="muted-cell cell-ref" data-label="Referrer">' + escapeHtml(s.referrer || "Direct") + "</td>" +
              '<td class="cell-ip" data-label="IP"><span class="' + protoClass + '">' + escapeHtml(s.ipVersion || "IPv4") + "</span></td>" +
              "</tr>"
            );
          })
          .join("");
      } else {
        thead.innerHTML =
          "<tr><th>Time</th><th>Page / Resource</th><th>Location</th><th>OS &amp; Browser</th><th>Network / ASN</th><th>Referrer</th><th>IP</th></tr>";

        var filteredEvents = !q
          ? cachedRecent
          : cachedRecent.filter(function (row) {
              var hay = [
                formatLocation(row.city, row.region, row.country),
                row.page, formatPageLabel(row.page), row.os, row.browser, row.org, row.referrer, row.ipVersion
              ].join(" ").toLowerCase();
              return hay.indexOf(q) !== -1;
            });

        if (countLabel) {
          countLabel.textContent = "Showing " + filteredEvents.length + " of " + cachedRecent.length + " recent events";
        }
        if (!filteredEvents.length) {
          var emptyEv = cachedRecent.length === 0
            ? "No events recorded yet — pageviews &amp; PDF downloads will appear once live on jiayisu.com."
            : "No matching events found.";
          tbody.innerHTML = '<tr><td colspan="7" class="dash-empty-cell">' + emptyEv + "</td></tr>";
          return;
        }
        tbody.innerHTML = filteredEvents
          .map(function (row) {
            var loc = formatLocation(row.city, row.region, row.country);
            var client = [row.os || "Other", row.browser || "Other"].join(" · ");
            var protoClass = row.ipVersion === "IPv6" ? "proto-badge proto-badge--v6" : "proto-badge";
            return (
              "<tr>" +
              '<td class="mono-cell cell-time" data-label="Time" title="' + escapeHtml(formatClock(row.ts)) + '">' + escapeHtml(formatRelativeTime(row.ts)) + "</td>" +
              '<td class="cell-trail" data-label="Page"><span class="' + pageBadgeClass(row.page) + '">' + escapeHtml(formatPageLabel(row.page)) + "</span></td>" +
              '<td class="cell-loc" data-label="Location"><strong>' + escapeHtml(loc) + "</strong></td>" +
              '<td class="cell-client" data-label="Client">' + escapeHtml(client) + ' <span class="device-tag">' + escapeHtml(row.device || "Desktop") + "</span></td>" +
              '<td class="muted-cell cell-org" data-label="Network">' + escapeHtml(row.org || "—") + "</td>" +
              '<td class="muted-cell cell-ref" data-label="Referrer">' + escapeHtml(row.referrer || "Direct") + "</td>" +
              '<td class="cell-ip" data-label="IP"><span class="' + protoClass + '">' + escapeHtml(row.ipVersion || "IPv4") + "</span></td>" +
              "</tr>"
            );
          })
          .join("");
      }
    }

    tabButtons.forEach(function (btn) {
      btn.addEventListener("click", function () {
        activeTab = btn.getAttribute("data-dash-tab") || "sessions";
        tabButtons.forEach(function (b) {
          var on = b === btn;
          b.classList.toggle("is-active", on);
          b.setAttribute("aria-selected", on ? "true" : "false");
        });
        renderActivity();
      });
    });

    if (searchInput) {
      searchInput.addEventListener("input", renderActivity);
    }

    fetchVisitorStats()
      .then(function (data) {
        var t = data.totals || {};
        if (banner) {
          if (data.isDemo) {
            banner.innerHTML =
              "<strong>Preview Mode (Sample Data)</strong> — Displaying sample country choropleth, page/PDF tracking, and visitor page trails (triggered via <code>?demo-map=1</code>). Live worker stays clean.";
            banner.classList.add("is-demo");
          } else {
            banner.innerHTML =
              '<span class="live-pulse"></span><strong>Live Edge Telemetry</strong> — Resolved directly by Cloudflare Workers &amp; D1 (IPv4 &amp; IPv6 geography, OS, browser, pages, and PDF downloads).';
            banner.classList.add("is-live");
          }
          banner.removeAttribute("hidden");
        }

        renderWorldSvg(mapHost, data.points || [], deriveCountryTotals(data), { compact: false });

        var setText = function (id, val) {
          var node = document.getElementById(id);
          if (node) node.textContent = val;
        };
        setText("kpi-views", Number(t.views || 0).toLocaleString());
        setText("kpi-unique", Number(t.uniqueVisitors || 0).toLocaleString());
        setText("kpi-countries", Number(t.countries || 0).toLocaleString());
        setText("kpi-cities", Number(t.cities || 0).toLocaleString());

        var pages = Array.isArray(data.pageBreakdown) && data.pageBreakdown.length
          ? data.pageBreakdown
          : derivePageBreakdown(data.recent);

        renderBreakdown("breakdown-pages", pages, formatPageLabel);
        renderBreakdown("breakdown-countries", normalizeCountryBreakdown(data.countryBreakdown), formatCountry);
        renderBreakdown("breakdown-os", data.osBreakdown, null);
        renderBreakdown("breakdown-browsers", data.browserBreakdown, null);

        cachedRecent = data.recent || [];
        cachedSessions = Array.isArray(data.sessions) && data.sessions.length
          ? data.sessions
          : deriveSessions(cachedRecent);
        renderActivity();
      })
      .catch(function (err) {
        if (banner) {
          banner.textContent = "Could not load live stats (" + err.message + "). Check your Worker URL or CORS settings.";
          banner.classList.add("is-error");
          banner.removeAttribute("hidden");
        }
      });
  }

  document.addEventListener("DOMContentLoaded", function () {
    initClickTracking();
    Promise.resolve(recordVisit()).then(function () {
      initHomeVisitorWidget();
      initVisitorDashboard();
    }, function () {
      initHomeVisitorWidget();
      initVisitorDashboard();
    });
  });
})();
