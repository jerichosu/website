(function () {
  "use strict";

  var forceSettled = /[?&]settled=1\b/.test(window.location.search);
  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches || forceSettled;

  /* ── Complete BibTeX registry for all 13 publications ── */
  var BIBTEX_MAP = {
    iecon2026: [
      "@inproceedings{su2026voltage,",
      "  author    = {Su, Jiayi and Liu, Luodan and Wei, Zhimin and Luo, Chunping},",
      "  title     = {Voltage-Strain Fusion for Lithium-ion cells State-of-Charge Estimation: Optimality, Fragility, and Mismatch Detection},",
      "  booktitle = {Annual Conference of the IEEE Industrial Electronics Society (IECON)},",
      "  year      = {2026},",
      "  note      = {Accepted}",
      "}"
    ].join("\n"),
    icpre2026: [
      "@inproceedings{su2026robust,",
      "  author    = {Su, Jiayi},",
      "  title     = {Robust State-of-Health Estimation for Lithium-Ion Cells Under Biased SOC Measurements via Extended Kalman Filtering with RTS Smoothing},",
      "  booktitle = {International Conference on Power and Renewable Energy (ICPRE)},",
      "  year      = {2026},",
      "  note      = {Accepted}",
      "}"
    ].join("\n"),
    su2026awtls: [
      "@inproceedings{su2026awtls,",
      "  author    = {Su, Jiayi and Wei, Zhimin and Liu, Luodan and Zhou, Xiaojing},",
      "  title     = {Online State of Health Estimation of Lithium-ion Cells Using Approximate Weighted Total Least Squares},",
      "  booktitle = {2026 9th International Conference on Electrical Engineering and Green Energy (CEEGE)},",
      "  year      = {2026},",
      "  pages     = {165--170},",
      "  publisher = {IEEE},",
      "  doi       = {10.1109/CEEGE70076.2026.11637656},",
      "  url       = {https://doi.org/10.1109/CEEGE70076.2026.11637656}",
      "}"
    ].join("\n"),
    mecc2025: [
      "@article{su2025pmsm_hinf,",
      "  author    = {Su, Jiayi and Schneider, Susan and Yaz, Edwin},",
      "  title     = {Permanent Magnet Synchronous Motor Speed and Position Estimation Using Nonlinear Reduced-Order {$H_\\infty$} Filter with Dynamic Uncertainties},",
      "  journal   = {IFAC-PapersOnLine (MECC 2025)},",
      "  year      = {2025},",
      "  publisher = {Elsevier},",
      "  url       = {https://www.sciencedirect.com/science/article/pii/S2405896325029404}",
      "}"
    ].join("\n"),
    mecc2024: [
      "@article{su2024pmsm_roekf,",
      "  author    = {Su, Jiayi and Schneider, Susan and Yaz, Edwin},",
      "  title     = {Permanent Magnet Synchronous Motor Speed and Position Estimation Using Reduced-Order Extended Kalman Filter},",
      "  journal   = {IFAC-PapersOnLine (MECC 2024)},",
      "  year      = {2024},",
      "  publisher = {Elsevier},",
      "  url       = {https://www.sciencedirect.com/science/article/pii/S2405896325000655}",
      "}"
    ].join("\n"),
    ccta2024: [
      "@inproceedings{su2024mot,",
      "  author    = {Su, Jiayi and Schneider, Susan and Yaz, Edwin},",
      "  title     = {Multi-Object Tracking Using Video Sequences with Improved Performance and Reduced Computation Cost},",
      "  booktitle = {IEEE Conference on Control Technology and Applications (CCTA)},",
      "  year      = {2024},",
      "  publisher = {IEEE},",
      "  url       = {https://ieeexplore.ieee.org/abstract/document/10666653}",
      "}"
    ].join("\n"),
    iecon2024: [
      "@inproceedings{su2024reduced_hinf,",
      "  author    = {Su, Jiayi and Schneider, Susan and Yaz, Edwin},",
      "  title     = {Reduced-order {$H_\\infty$} Filter for Linear Systems},",
      "  booktitle = {Annual Conference of the IEEE Industrial Electronics Society (IECON)},",
      "  year      = {2024},",
      "  publisher = {IEEE}",
      "}"
    ].join("\n"),
    avss2022: [
      "@inproceedings{su2022violence,",
      "  author    = {Su, Jiayi and Her, Paris and Clemens, Erik and Schneider, Susan and Yaz, Edwin and Medeiros, Henry},",
      "  title     = {Violence Detection using 3D Convolutional Neural Networks},",
      "  booktitle = {IEEE International Conference on Advanced Video and Signal Based Surveillance (AVSS)},",
      "  year      = {2022},",
      "  publisher = {IEEE},",
      "  url       = {https://ieeexplore.ieee.org/document/9959393}",
      "}"
    ].join("\n"),
    ccta2022: [
      "@inproceedings{su2022simultaneous,",
      "  author    = {Su, Jiayi and Schneider, Susan and Yaz, Edwin and Josse, Fabien},",
      "  title     = {Simultaneous State of Charge and Total Capacity Estimation of Lithium-ion Cells Using Multiple Model Adaptive Estimation},",
      "  booktitle = {IEEE Conference on Control Technology and Applications (CCTA)},",
      "  year      = {2022},",
      "  publisher = {IEEE},",
      "  url       = {https://ieeexplore.ieee.org/document/9965999}",
      "}"
    ].join("\n"),
    ecc2021: [
      "@inproceedings{su2021improved,",
      "  author    = {Su, Jiayi and Strandt, Alia and Schneider, Susan and Yaz, Edwin and Josse, Fabien},",
      "  title     = {Improved State of Charge Estimation of Lithium-ion Battery Cells},",
      "  booktitle = {European Control Conference (ECC)},",
      "  year      = {2021},",
      "  publisher = {IEEE},",
      "  url       = {https://ieeexplore.ieee.org/abstract/document/9654838}",
      "}"
    ].join("\n"),
    acc2021: [
      "@inproceedings{su2021online,",
      "  author    = {Su, Jiayi and Schneider, Susan and Yaz, Edwin and Josse, Fabien},",
      "  title     = {Online State of Charge Estimation of Lithium-ion Battery Cells: A Multiple Model Adaptive Estimation Approach},",
      "  booktitle = {American Control Conference (ACC)},",
      "  year      = {2021},",
      "  publisher = {IEEE},",
      "  url       = {https://ieeexplore.ieee.org/document/9482734}",
      "}"
    ].join("\n"),
    dscc2020: [
      "@inproceedings{su2020intrusion,",
      "  author    = {Su, Jiayi and Weng, Yuqin and Schneider, Susan and Yaz, Edwin},",
      "  title     = {Sensor and Actuator Intrusion Detection for Cyber-Physical Systems via Adaptive Estimation Algorithm},",
      "  booktitle = {ASME Dynamic Systems and Control Conference (DSCC)},",
      "  year      = {2020},",
      "  url       = {https://asmedigitalcollection.asme.org/DSCC/proceedings-abstract/DSCC2020/84287/V002T33A002/1096580}",
      "}"
    ].join("\n"),
    cdsr2020: [
      "@inproceedings{su2020accelerated,",
      "  author    = {Su, Jiayi and Weng, Yuqin and Schneider, Susan and Yaz, Edwin},",
      "  title     = {Accelerated Detection Method for Sensor and Actuator Intrusions in Cyber-Physical Systems Using Multiple Model Estimation Algorithm},",
      "  booktitle = {International Conference of Control, Dynamic Systems, and Robotics (CDSR)},",
      "  year      = {2020},",
      "  url       = {https://avestia.com/CDSR2020_Proceedings/files/papers.html}",
      "}"
    ].join("\n")
  };

  function clamp(v, min, max) {
    return Math.max(min, Math.min(max, v));
  }

  function easeOutCubic(t) {
    return 1 - Math.pow(1 - t, 3);
  }

  /* ── Toast helper ── */
  var toastEl = null;
  var toastTimer = 0;

  function showToast(message) {
    if (!toastEl) {
      toastEl = document.createElement("div");
      toastEl.className = "copy-toast";
      toastEl.setAttribute("role", "status");
      toastEl.setAttribute("aria-live", "polite");
      document.body.appendChild(toastEl);
    }
    toastEl.textContent = message;
    toastEl.classList.add("is-visible");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () {
      toastEl.classList.remove("is-visible");
    }, 2200);
  }

  function copyText(text) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      return navigator.clipboard.writeText(text).catch(function () {
        return legacyCopy(text);
      });
    }
    return legacyCopy(text);
  }

  function legacyCopy(text) {
    return new Promise(function (resolve) {
      var ta = document.createElement("textarea");
      ta.value = text;
      ta.setAttribute("readonly", "");
      ta.style.position = "fixed";
      ta.style.left = "-9999px";
      document.body.appendChild(ta);
      ta.select();
      try { document.execCommand("copy"); } catch (e) {}
      document.body.removeChild(ta);
      resolve();
    });
  }

  /* ── 1. BibTeX one-click copy ── */
  function initBibtexCopy() {
    document.addEventListener("click", function (event) {
      var btn = event.target.closest && event.target.closest("[data-bibtex]");
      if (!btn) return;
      var key = btn.getAttribute("data-bibtex");
      var entry = BIBTEX_MAP[key];
      if (!entry) return;

      copyText(entry).then(function () {
        var original = btn.dataset.originalLabel || btn.textContent;
        btn.dataset.originalLabel = original;
        btn.textContent = "Copied ✓";
        btn.classList.add("is-copied");
        showToast("Copied BibTeX (" + key + ")");
        clearTimeout(Number(btn.dataset.resetTimer || 0));
        btn.dataset.resetTimer = String(setTimeout(function () {
          btn.textContent = original;
          btn.classList.remove("is-copied");
        }, 1800));
      });
    });
  }

  /* ── 2. Publication topic filters & Research jump links ── */
  function initPublicationFilters() {
    var pubSection = document.getElementById("publications");
    if (!pubSection) return;

    var filterButtons = Array.prototype.slice.call(
      pubSection.querySelectorAll("[data-filter-topic]")
    );
    var cards = Array.prototype.slice.call(
      pubSection.querySelectorAll(".pub-list .pub-card")
    );
    var dividers = Array.prototype.slice.call(
      pubSection.querySelectorAll(".pub-list .pub-divider")
    );
    var countEl = pubSection.querySelector("[data-filter-count]");

    function applyFilter(topic) {
      var visibleCount = 0;
      cards.forEach(function (card) {
        var cardTopic = card.getAttribute("data-topic") || "all";
        var show = topic === "all" || cardTopic === topic;
        card.classList.toggle("is-hidden", !show);
        if (show) visibleCount += 1;
      });

      // Keep dividers only between visible cards
      if (dividers.length) {
        var list = pubSection.querySelector(".pub-list");
        if (list) {
          var seenVisible = false;
          var children = Array.prototype.slice.call(list.children);
          // Reset all dividers hidden, then turn on between consecutive visible cards
          dividers.forEach(function (d) { d.classList.add("is-hidden"); });
          var lastVisibleCard = null;
          children.forEach(function (el) {
            if (el.classList.contains("pub-card") && !el.classList.contains("is-hidden")) {
              if (lastVisibleCard) {
                var prev = el.previousElementSibling;
                while (prev && prev !== lastVisibleCard) {
                  if (prev.classList.contains("pub-divider")) {
                    prev.classList.remove("is-hidden");
                    break;
                  }
                  prev = prev.previousElementSibling;
                }
              }
              lastVisibleCard = el;
              seenVisible = true;
            }
          });
          if (!seenVisible) {
            dividers.forEach(function (d) { d.classList.add("is-hidden"); });
          }
        }
      }

      filterButtons.forEach(function (btn) {
        var active = btn.getAttribute("data-filter-topic") === topic;
        btn.classList.toggle("is-active", active);
        btn.setAttribute("aria-pressed", active ? "true" : "false");
      });

      if (countEl) {
        countEl.textContent = "Showing " + visibleCount + " of " + cards.length;
      }
    }

    filterButtons.forEach(function (btn) {
      btn.addEventListener("click", function () {
        applyFilter(btn.getAttribute("data-filter-topic") || "all");
      });
    });

    function pulseCard(card) {
      if (!card) return;
      card.classList.remove("is-highlighted");
      void card.offsetWidth;
      card.classList.add("is-highlighted");
      setTimeout(function () {
        card.classList.remove("is-highlighted");
      }, 1700);
    }

    document.addEventListener("click", function (event) {
      var topicBtn = event.target.closest && event.target.closest("[data-jump-topic]");
      if (topicBtn) {
        event.preventDefault();
        var t = topicBtn.getAttribute("data-jump-topic") || "all";
        applyFilter(t);
        pubSection.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "start" });
        var firstMatch = cards.find(function (c) { return !c.classList.contains("is-hidden"); });
        setTimeout(function () { pulseCard(firstMatch); }, 280);
        return;
      }

      var paperLink = event.target.closest && event.target.closest("a[href^='#paper-']");
      if (paperLink) {
        var id = paperLink.getAttribute("href").slice(1);
        var target = document.getElementById(id);
        if (!target) return;
        if (target.classList.contains("is-hidden")) {
          applyFilter("all");
        }
        setTimeout(function () { pulseCard(target); }, 220);
      }
    });

    applyFilter("all");
  }

  /* ── 3. Mobile abstract expand/collapse ── */
  function initMobileAbstracts() {
    document.addEventListener("click", function (event) {
      var btn = event.target.closest && event.target.closest(".abstract-toggle");
      if (!btn) return;
      var wrap = btn.closest(".pub-abstract");
      if (!wrap) return;
      var expanded = wrap.classList.toggle("is-expanded");
      btn.setAttribute("aria-expanded", expanded ? "true" : "false");
      btn.textContent = expanded ? "Show less" : "Read more";
    });
  }

  /* ── 4. News archive toggle ── */
  function initNewsMore() {
    var list = document.querySelector("#news .news-list");
    var btn = document.getElementById("news-more");
    if (!list || !btn) return;

    btn.addEventListener("click", function () {
      var expanded = list.classList.toggle("is-expanded");
      btn.setAttribute("aria-expanded", expanded ? "true" : "false");
      btn.textContent = expanded ? "Show less" : "Show earlier news";
    });
  }

  /* ── 5. Navigation scroll-spy & mobile drawer ── */
  function initNavigation() {
    var nav = document.getElementById("site-nav");
    var sideNav = document.querySelector(".side-nav");
    var links = Array.prototype.slice.call(
      document.querySelectorAll('#site-nav .links a[href^="#"], .side-nav a[href^="#"]')
    );

    var frame = 0;
    function updateCurrentLink() {
      frame = 0;
      if (!links.length) return;
      var navBottom = nav && nav.offsetHeight ? nav.getBoundingClientRect().bottom + 14 : 90;
      var readingLine = Math.max(navBottom, 90);

      // Compute unique target IDs
      var activeId = null;
      var seenIds = {};
      links.forEach(function (link) {
        var id = link.getAttribute("href").slice(1);
        if (!id || seenIds[id]) return;
        seenIds[id] = true;
        var target = document.getElementById(id);
        if (!target) return;
        var bounds = target.getBoundingClientRect();
        if (bounds.top <= readingLine && bounds.bottom >= readingLine) {
          activeId = id;
        }
      });

      if (!activeId && window.scrollY < 160) {
        activeId = links[0].getAttribute("href").slice(1);
      }
      if (!activeId) return;

      links.forEach(function (link) {
        var isMatch = link.getAttribute("href").slice(1) === activeId;
        if (isMatch) {
          link.setAttribute("aria-current", "location");
          link.classList.add("is-active");
        } else {
          link.removeAttribute("aria-current");
          link.classList.remove("is-active");
        }
      });
    }

    function scheduleUpdate() {
      if (!frame) frame = requestAnimationFrame(updateCurrentLink);
    }

    if (links.length) {
      window.addEventListener("scroll", scheduleUpdate, { passive: true });
      window.addEventListener("resize", scheduleUpdate);
      updateCurrentLink();
    }

    if (!nav) return;
    var toggle = nav.querySelector(".nav-toggle");
    if (!toggle) return;

    function setOpen(open) {
      nav.classList.toggle("is-open", open);
      toggle.setAttribute("aria-expanded", String(open));
      toggle.setAttribute("aria-label", open ? "Close menu" : "Open menu");
    }

    toggle.addEventListener("click", function () {
      setOpen(!nav.classList.contains("is-open"));
    });

    links.forEach(function (link) {
      link.addEventListener("click", function () {
        if (nav.classList.contains("is-open")) setOpen(false);
      });
    });

    document.addEventListener("keydown", function (event) {
      if (event.key === "Escape" && nav.classList.contains("is-open")) {
        setOpen(false);
        toggle.focus();
      }
    });

    document.addEventListener("pointerdown", function (event) {
      if (nav.classList.contains("is-open") && !nav.contains(event.target)) {
        setOpen(false);
      }
    });
  }

  /* ── 6. Lazy autoplay videos respecting manual pause ── */
  function initLazyVideos() {
    if (reduceMotion || !("IntersectionObserver" in window)) return;
    document.querySelectorAll("video[data-autoplay-inview]").forEach(function (video) {
      var userPaused = false;
      var pausedByScroll = false;
      var observer = new IntersectionObserver(function (entries) {
        var visible = entries[entries.length - 1].intersectionRatio >= 0.15;
        if (visible && !userPaused && video.paused) {
          var playback = video.play();
          if (playback) playback.catch(function () {});
        } else if (!visible && !video.paused) {
          pausedByScroll = true;
          video.pause();
        }
      }, { threshold: [0, 0.15] });

      video.addEventListener("pause", function () {
        if (!pausedByScroll && !video.ended) userPaused = true;
        pausedByScroll = false;
      });
      video.addEventListener("play", function () {
        userPaused = false;
      });
      observer.observe(video);
    });
  }

  /* ── 7. Enhanced Runner Particle Field with Theme Palettes + Photo Toggle ── */
  function initRunnerParticles() {
    var stage = document.querySelector("[data-runner-particles]");
    if (!stage) return;

    var img = stage.querySelector(".runner-source");
    if (!img) return;

    var glow = document.createElement("span");
    glow.className = "runner-glow";
    glow.setAttribute("aria-hidden", "true");
    stage.appendChild(glow);

    var canvas = document.createElement("canvas");
    canvas.className = "runner-particle-canvas";
    canvas.setAttribute("aria-hidden", "true");
    stage.appendChild(canvas);

    var ctx = canvas.getContext("2d");
    if (!ctx) return;

    var dpr = 1;
    var w = 0;
    var h = 0;
    var particles = [];
    var raf = 0;
    var startedAt = 0;
    var stageInView = !("IntersectionObserver" in window);
    var showingPhoto = false;
    var pointer = { active: false, x: 0, y: 0 };

    function getTheme() {
      return stage.getAttribute("data-particle-theme") || "warm";
    }

    function measure() {
      var rect = stage.getBoundingClientRect();
      w = Math.max(180, rect.width);
      h = Math.max(240, rect.height);
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      canvas.style.width = w + "px";
      canvas.style.height = h + "px";
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    function blendColor(r, g, b, kind, theme) {
      if (theme === "dark") {
        if (kind === "sky") {
          return [
            Math.round(r * 0.14 + 36 * 0.86),
            Math.round(g * 0.18 + 130 * 0.82),
            Math.round(b * 0.25 + 215 * 0.75)
          ];
        }
        if (kind === "grass") {
          return [
            Math.round(r * 0.18 + 20 * 0.82),
            Math.round(g * 0.24 + 95 * 0.76),
            Math.round(b * 0.22 + 95 * 0.78)
          ];
        }
        if (kind === "runner") {
          var lum = (r + g + b) / 3;
          var warm = r > 115 && r > g * 1.1;
          if (warm) {
            return [
              Math.min(255, Math.round(r * 0.75 + 245 * 0.25)),
              Math.min(255, Math.round(g * 0.65 + 158 * 0.35)),
              Math.min(255, Math.round(b * 0.45 + 32 * 0.55))
            ];
          }
          // Lift dark outfit/shadows so the runner stands out luminously on #0B0F17
          var lift = lum < 95 ? 85 : 28;
          return [
            Math.min(255, Math.round(r * 0.72 + lift * 0.7 + 56 * 0.28)),
            Math.min(255, Math.round(g * 0.74 + lift * 0.82 + 189 * 0.26)),
            Math.min(255, Math.round(b * 0.78 + lift * 0.95 + 248 * 0.28))
          ];
        }
        return [
          Math.round(r * 0.25 + 75 * 0.75),
          Math.round(g * 0.28 + 95 * 0.72),
          Math.round(b * 0.35 + 128 * 0.65)
        ];
      }

      if (theme === "cool") {
        if (kind === "sky") {
          return [
            Math.round(r * 0.18 + 96 * 0.82),
            Math.round(g * 0.22 + 158 * 0.78),
            Math.round(b * 0.30 + 235 * 0.70)
          ];
        }
        if (kind === "grass") {
          return [
            Math.round(r * 0.26 + 52 * 0.74),
            Math.round(g * 0.32 + 94 * 0.68),
            Math.round(b * 0.34 + 108 * 0.66)
          ];
        }
        if (kind === "runner") {
          var isWarm = r > 120 && r > g * 1.12;
          if (isWarm) {
            return [
              Math.round(r * 0.74 + 29 * 0.26),
              Math.round(g * 0.72 + 78 * 0.28),
              Math.round(b * 0.68 + 216 * 0.32)
            ];
          }
          return [
            Math.round(r * 0.86 + 15 * 0.14),
            Math.round(g * 0.86 + 23 * 0.14),
            Math.round(b * 0.88 + 42 * 0.12)
          ];
        }
        return [
          Math.round(r * 0.60 + 226 * 0.40),
          Math.round(g * 0.62 + 232 * 0.38),
          Math.round(b * 0.66 + 240 * 0.34)
        ];
      }

      if (theme === "bento") {
        if (kind === "sky") {
          return [
            Math.round(r * 0.22 + 59 * 0.78),
            Math.round(g * 0.24 + 130 * 0.76),
            Math.round(b * 0.32 + 246 * 0.68)
          ];
        }
        if (kind === "grass") {
          return [
            Math.round(r * 0.28 + 16 * 0.72),
            Math.round(g * 0.34 + 128 * 0.66),
            Math.round(b * 0.30 + 92 * 0.70)
          ];
        }
        if (kind === "runner") {
          return [r, g, b];
        }
        return [
          Math.round(r * 0.66 + 241 * 0.34),
          Math.round(g * 0.66 + 245 * 0.34),
          Math.round(b * 0.68 + 249 * 0.32)
        ];
      }

      // Default: "warm" (Style A refined editorial)
      if (kind === "sky") {
        return [
          Math.round(r * 0.20 + 55 * 0.80),
          Math.round(g * 0.22 + 125 * 0.78),
          Math.round(b * 0.28 + 185 * 0.72)
        ];
      }
      if (kind === "grass") {
        return [
          Math.round(r * 0.30 + 32 * 0.70),
          Math.round(g * 0.32 + 68 * 0.68),
          Math.round(b * 0.28 + 38 * 0.72)
        ];
      }
      if (kind === "runner") {
        return [r, g, b];
      }
      return [
        Math.round(r * 0.72 + 244 * 0.28),
        Math.round(g * 0.72 + 239 * 0.28),
        Math.round(b * 0.72 + 230 * 0.28)
      ];
    }

    function nearSegment(px, py, x1, y1, x2, y2, radius) {
      var dx = x2 - x1;
      var dy = y2 - y1;
      var lenSq = dx * dx + dy * dy;
      var t = lenSq ? ((px - x1) * dx + (py - y1) * dy) / lenSq : 0;
      t = clamp(t, 0, 1);
      var ox = px - (x1 + t * dx);
      var oy = py - (y1 + t * dy);
      return ox * ox + oy * oy <= radius * radius;
    }

    function inEllipse(px, py, cx, cy, rx, ry) {
      var dx = (px - cx) / rx;
      var dy = (py - cy) / ry;
      return dx * dx + dy * dy <= 1;
    }

    function isRaisedFoot(nx, ny) {
      return nearSegment(nx, ny, 0.50, 0.50, 0.39, 0.58, 0.078) ||
        nearSegment(nx, ny, 0.39, 0.58, 0.245, 0.615, 0.068) ||
        inEllipse(nx, ny, 0.245, 0.615, 0.075, 0.048);
    }

    function isRunnerSilhouette(nx, ny) {
      return inEllipse(nx, ny, 0.55, 0.23, 0.075, 0.08) ||
        inEllipse(nx, ny, 0.52, 0.39, 0.115, 0.17) ||
        nearSegment(nx, ny, 0.47, 0.31, 0.40, 0.47, 0.052) ||
        nearSegment(nx, ny, 0.40, 0.47, 0.49, 0.50, 0.04) ||
        nearSegment(nx, ny, 0.59, 0.33, 0.68, 0.40, 0.045) ||
        isRaisedFoot(nx, ny) ||
        nearSegment(nx, ny, 0.54, 0.52, 0.56, 0.67, 0.065) ||
        nearSegment(nx, ny, 0.56, 0.67, 0.69, 0.76, 0.055);
    }

    function sample() {
      if (!window.RUNNER_PARTICLE_DATA || !Array.isArray(window.RUNNER_PARTICLE_DATA.points)) {
        return;
      }
      var theme = getTheme();
      var kindMap = ["sky", "grass", "runner", "field"];
      particles = window.RUNNER_PARTICLE_DATA.points.reduce(function (next, row) {
        var nx = row[0];
        var ny = row[1];
        var kind = kindMap[row[5]] || "field";
        var raisedFoot = isRaisedFoot(nx, ny);

        if (kind === "field" && raisedFoot) {
          var footWarm = row[2] > row[3] * 1.045 && row[2] > row[4] * 1.02;
          var footPink = row[2] > 145 && row[4] > 120 && row[3] < row[2] * 0.96;
          if (footWarm || footPink) kind = "runner";
        }

        var greenGround = ny > 0.57 && row[3] > row[2] * 1.06 && row[3] > row[4] * 1.06;
        if (kind === "runner" && greenGround) {
          if (row[9] > 0.34) return next;
          kind = "grass";
        }

        if (kind === "runner" && !isRunnerSilhouette(nx, ny)) {
          var isGround = ny > 0.57;
          var keepProbability = isGround ? 0.34 : 0.14;
          if (row[9] > keepProbability) return next;
          kind = isGround ? "grass" : "field";
        }

        var tx = nx * w;
        var ty = ny * h;
        var displayColor = blendColor(row[2], row[3], row[4], kind, theme);
        var darkMode = theme === "dark";
        next.push({
          tx: tx,
          ty: ty,
          sx: tx - w * (0.58 + row[9] * 0.68),
          sy: ty + (row[9] - 0.5) * h * 0.32,
          nx: nx,
          ny: ny,
          r: displayColor[0],
          g: displayColor[1],
          b: displayColor[2],
          kind: kind,
          raisedFoot: raisedFoot && kind === "runner",
          phase: row[8],
          delay: row[9] * 520 + nx * 520,
          size: kind === "runner" ? row[6] * (raisedFoot ? 1.18 : 1) : Math.min(row[6], 1.45),
          alpha: kind === "runner"
            ? row[7]
            : darkMode
              ? (kind === "grass" ? 0.36 : kind === "sky" ? 0.42 : 0.28)
              : (kind === "grass" ? 0.66 : kind === "sky" ? 0.58 : 0.50)
        });
        return next;
      }, []);

      document.body.classList.add("particle-ready");
    }

    function drawSpeedLines(time, theme) {
      ctx.save();
      ctx.lineCap = "round";
      var colorA = theme === "dark" ? "#f59e0b" : theme === "cool" ? "#1d4ed8" : theme === "bento" ? "#ea580c" : "#c9582a";
      var colorB = theme === "dark" ? "#38bdf8" : theme === "cool" ? "#64748b" : theme === "bento" ? "#2563eb" : "#184e86";
      var baseAlpha = theme === "dark" ? 0.11 : 0.055;
      for (var i = 0; i < 13; i += 1) {
        var y = h * (0.25 + i * 0.046) + Math.sin(time * 2.4 + i) * 4;
        var x1 = w * (0.82 + Math.sin(time + i) * 0.018);
        var len = w * (0.16 + (i % 4) * 0.025);
        ctx.globalAlpha = baseAlpha + (i % 3) * 0.02;
        ctx.strokeStyle = i % 3 === 0 ? colorA : colorB;
        ctx.lineWidth = i % 4 === 0 ? 1.6 : 1;
        ctx.beginPath();
        ctx.moveTo(x1, y);
        ctx.lineTo(x1 - len, y + Math.sin(i) * 5);
        ctx.stroke();
      }
      ctx.restore();
    }

    function drawFrame(now) {
      var theme = getTheme();
      var elapsed = now - startedAt;
      var intro = reduceMotion ? 1 : clamp(elapsed / 1600, 0, 1);
      var introEase = easeOutCubic(intro);
      var time = now * 0.001;

      ctx.clearRect(0, 0, w, h);
      drawSpeedLines(time, theme);

      for (var i = 0; i < particles.length; i += 1) {
        var p = particles[i];
        var local = reduceMotion ? 1 : clamp((elapsed - p.delay) / 850, 0, 1);
        var land = easeOutCubic(local) * introEase;
        var x = p.sx + (p.tx - p.sx) * land;
        var y = p.sy + (p.ty - p.sy) * land;
        var alpha = p.alpha * clamp(local + 0.15, 0, 1);
        var size = p.size;

        if (p.kind === "runner") {
          var stride = Math.sin(time * 5.2 + p.phase);
          var lowerBody = p.ny > 0.58 ? 1.9 : p.ny > 0.38 ? 1.05 : 0.45;
          var pulse = Math.sin(time * 2.5 + p.phase) * 0.8;
          x += stride * lowerBody * 2.7 + pulse;
          y += Math.cos(time * 5.0 + p.phase) * lowerBody * 0.85;
        } else if (!reduceMotion) {
          x += Math.sin(time * 0.9 + p.phase) * (p.kind === "sky" ? 0.35 : 0.65);
          y += Math.cos(time * 0.7 + p.phase) * (p.kind === "grass" ? 0.55 : 0.3);
        }

        if (pointer.active) {
          var dx = x - pointer.x;
          var dy = y - pointer.y;
          var dist = Math.sqrt(dx * dx + dy * dy) || 1;
          var radius = Math.max(76, w * 0.22);
          if (dist < radius) {
            var push = (1 - dist / radius) * 24;
            x += (dx / dist) * push;
            y += (dy / dist) * push;
            size *= 1.22;
            alpha = Math.min(1, alpha + 0.16);
          }
        }

        if (p.kind === "runner") {
          for (var g = 3; g > 0; g -= 1) {
            ctx.globalAlpha = alpha * (0.055 * g);
            ctx.fillStyle = "rgb(" + p.r + "," + p.g + "," + p.b + ")";
            ctx.fillRect(x - g * (7 + lowerBody * 2), y + g * 0.55, size, size);
          }
        }

        ctx.globalAlpha = alpha;
        ctx.fillStyle = "rgb(" + p.r + "," + p.g + "," + p.b + ")";
        ctx.fillRect(x, y, size, size);
      }

      ctx.globalAlpha = 1;
      raf = reduceMotion || showingPhoto ? 0 : requestAnimationFrame(drawFrame);
    }

    function updatePlayback() {
      cancelAnimationFrame(raf);
      raf = 0;
      if (showingPhoto || !stageInView || document.hidden || !particles.length) return;
      if (!startedAt) startedAt = performance.now();
      raf = requestAnimationFrame(drawFrame);
    }

    function rebuild() {
      measure();
      sample();
      if (reduceMotion) {
        startedAt = performance.now();
        drawFrame(startedAt);
      } else {
        updatePlayback();
      }
    }

    var toggleBtn = stage.querySelector("[data-runner-toggle]");
    if (toggleBtn) {
      toggleBtn.addEventListener("click", function () {
        stage.classList.add("has-toggled");
        showingPhoto = !showingPhoto;
        stage.classList.toggle("show-photo", showingPhoto);
        toggleBtn.setAttribute("aria-pressed", showingPhoto ? "true" : "false");
        toggleBtn.textContent = showingPhoto ? "Particles" : "Photo";
        if (!showingPhoto) {
          if (reduceMotion) {
            drawFrame(performance.now());
          } else {
            updatePlayback();
          }
        } else {
          cancelAnimationFrame(raf);
          raf = 0;
        }
      });
    }

    var resizeTimer = 0;
    window.addEventListener("resize", function () {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(rebuild, 180);
    });

    stage.addEventListener("pointermove", function (event) {
      if (showingPhoto) return;
      var rect = canvas.getBoundingClientRect();
      pointer.x = event.clientX - rect.left;
      pointer.y = event.clientY - rect.top;
      pointer.active = true;
    });

    stage.addEventListener("pointerleave", function () {
      pointer.active = false;
    });

    stage.addEventListener("particle-theme-change", function () {
      rebuild();
    });

    document.addEventListener("visibilitychange", updatePlayback);

    if ("IntersectionObserver" in window) {
      new IntersectionObserver(function (entries) {
        stageInView = entries[0].isIntersecting;
        updatePlayback();
      }).observe(stage);
    }

    if (window.RUNNER_PARTICLE_DATA && Array.isArray(window.RUNNER_PARTICLE_DATA.points)) {
      rebuild();
    } else if (img.complete && img.naturalWidth) {
      rebuild();
    } else {
      img.addEventListener("load", rebuild, { once: true });
    }
  }

  /* ── 8. Editorial top reading progress bar ── */
  function initReadProgress() {
    var bar = document.getElementById("read-progress");
    if (!bar || reduceMotion) return;

    var frame = 0;
    function update() {
      frame = 0;
      var max = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
      var ratio = clamp(window.scrollY / max, 0, 1);
      bar.style.transform = "scaleX(" + ratio.toFixed(4) + ")";
    }

    function schedule() {
      if (!frame) frame = requestAnimationFrame(update);
    }

    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    update();
  }

  document.addEventListener("DOMContentLoaded", function () {
      initBibtexCopy();
      initPublicationFilters();
      initMobileAbstracts();
      initNewsMore();
      initNavigation();
      initReadProgress();
      initLazyVideos();
      initRunnerParticles();
    });
})();
