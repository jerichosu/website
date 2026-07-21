(function () {
  "use strict";

  var forceSettled = /[?&]settled=1\b/.test(window.location.search);
  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches || forceSettled;

  function clamp(v, min, max) {
    return Math.max(min, Math.min(max, v));
  }

  function easeOutCubic(t) {
    return 1 - Math.pow(1 - t, 3);
  }

  function addReveal() {
    var nodes = Array.prototype.slice.call(
      document.querySelectorAll(".erdos, section, .pub-card")
    );

    if (reduceMotion || !("IntersectionObserver" in window)) {
      nodes.forEach(function (node) { node.classList.add("is-visible"); });
      return;
    }

    nodes.forEach(function (node) { node.classList.add("will-reveal"); });

    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          io.unobserve(entry.target);
        }
      });
    }, { rootMargin: "0px 0px -12% 0px", threshold: 0.06 });

    nodes.forEach(function (node) { io.observe(node); });
  }

  function initNavSpy() {
    var links = Array.prototype.slice.call(document.querySelectorAll("nav .links a[href^='#']"));
    if (!links.length || !("IntersectionObserver" in window)) return;

    var byId = {};
    links.forEach(function (link) {
      var id = link.getAttribute("href").slice(1);
      if (id) byId[id] = link;
    });

    var sections = Object.keys(byId)
      .map(function (id) { return document.getElementById(id); })
      .filter(Boolean);

    function setActive(id) {
      links.forEach(function (link) {
        link.classList.toggle("is-active", link === byId[id]);
      });
    }

    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) setActive(entry.target.id);
      });
    }, { rootMargin: "-42% 0px -52% 0px", threshold: 0.01 });

    sections.forEach(function (section) { io.observe(section); });
  }

  function initMobileNav() {
    var nav = document.getElementById("site-nav");
    var toggle = document.getElementById("nav-toggle");
    var links = document.getElementById("nav-links");
    if (!nav || !toggle || !links) return;

    function setOpen(open) {
      nav.classList.toggle("is-open", open);
      toggle.setAttribute("aria-expanded", open ? "true" : "false");
      toggle.setAttribute("aria-label", open ? "Close menu" : "Open menu");
    }

    toggle.addEventListener("click", function () {
      setOpen(!nav.classList.contains("is-open"));
    });

    links.querySelectorAll("a").forEach(function (link) {
      link.addEventListener("click", function () { setOpen(false); });
    });

    document.addEventListener("keydown", function (event) {
      if (event.key === "Escape") setOpen(false);
    });

    window.addEventListener("resize", function () {
      if (window.innerWidth > 520) setOpen(false);
    });
  }

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

  function hydrateVideo(video) {
    if (video.dataset.hydrated === "1") return;
    var sources = video.querySelectorAll("source[data-src]");
    sources.forEach(function (source) {
      source.src = source.getAttribute("data-src");
      source.removeAttribute("data-src");
    });
    if (video.dataset.src) {
      video.src = video.dataset.src;
      delete video.dataset.src;
    }
    video.load();
    video.dataset.hydrated = "1";
  }

  function initLazyVideos() {
    var videos = Array.prototype.slice.call(
      document.querySelectorAll("video[data-autoplay-inview], video.lazy-media")
    );
    if (!videos.length) return;

    function playSafe(video) {
      hydrateVideo(video);
      var playPromise = video.play();
      if (playPromise && typeof playPromise.catch === "function") {
        playPromise.catch(function () {});
      }
    }

    if (reduceMotion) {
      videos.forEach(function (video) {
        video.removeAttribute("autoplay");
        video.controls = true;
        video.preload = "metadata";
      });
    }

    if (!("IntersectionObserver" in window)) {
      videos.forEach(function (video) {
        hydrateVideo(video);
        if (!reduceMotion) playSafe(video);
      });
      return;
    }

    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        var video = entry.target;
        if (entry.isIntersecting) {
          if (reduceMotion) hydrateVideo(video);
          else playSafe(video);
        } else if (!video.paused) {
          video.pause();
        }
      });
    }, { rootMargin: "120px 0px", threshold: 0.15 });

    videos.forEach(function (video) { io.observe(video); });
  }

  function initRunnerParticles() {
    var stage = document.querySelector("[data-runner-particles]");
    if (!stage) return;

    var img = stage.querySelector(".runner-source");
    if (!img) return;

    var glow = document.createElement("span");
    glow.className = "runner-glow";
    stage.appendChild(glow);

    ["top", "side"].forEach(function (kind) {
      var measure = document.createElement("span");
      measure.className = "runner-measure runner-measure--" + kind;
      stage.appendChild(measure);
    });

    var canvas = document.createElement("canvas");
    canvas.className = "runner-particle-canvas";
    canvas.setAttribute("aria-hidden", "true");
    stage.appendChild(canvas);

    var ctx = canvas.getContext("2d");
    var dpr = 1;
    var w = 0;
    var h = 0;
    var particles = [];
    var raf = 0;
    var startedAt = 0;
    var pointer = { active: false, x: 0, y: 0 };

    function measure() {
      var rect = stage.getBoundingClientRect();
      w = Math.max(240, rect.width);
      h = Math.max(320, rect.height);
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      canvas.style.width = w + "px";
      canvas.style.height = h + "px";
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    function blendColor(r, g, b, kind) {
      if (kind === "sky") {
        return [
          Math.round(r * .20 + 55 * .80),
          Math.round(g * .22 + 125 * .78),
          Math.round(b * .28 + 185 * .72)
        ];
      }
      if (kind === "grass") {
        return [
          Math.round(r * .30 + 32 * .70),
          Math.round(g * .32 + 68 * .68),
          Math.round(b * .28 + 38 * .72)
        ];
      }
      if (kind === "runner") {
        var warm = r > 120 && r > g * 1.12;
        if (warm) {
          return [
            Math.round(r * .72 + 240 * .28),
            Math.round(g * .62 + 101 * .38),
            Math.round(b * .58 + 46 * .42)
          ];
        }
        return [
          Math.round(r * .78 + 26 * .22),
          Math.round(g * .76 + 23 * .24),
          Math.round(b * .76 + 20 * .24)
        ];
      }
      return [
        Math.round(r * .72 + 244 * .28),
        Math.round(g * .72 + 239 * .28),
        Math.round(b * .72 + 230 * .28)
      ];
    }

    function nearSegment(px, py, x1, y1, x2, y2, radius) {
      var dx = x2 - x1;
      var dy = y2 - y1;
      var lengthSquared = dx * dx + dy * dy;
      var t = lengthSquared ? ((px - x1) * dx + (py - y1) * dy) / lengthSquared : 0;
      t = clamp(t, 0, 1);
      var nearestX = x1 + t * dx;
      var nearestY = y1 + t * dy;
      var offsetX = px - nearestX;
      var offsetY = py - nearestY;
      return offsetX * offsetX + offsetY * offsetY <= radius * radius;
    }

    function inEllipse(px, py, cx, cy, radiusX, radiusY) {
      var dx = (px - cx) / radiusX;
      var dy = (py - cy) / radiusY;
      return dx * dx + dy * dy <= 1;
    }

    // A compact silhouette keeps dark grass and track details from being
    // promoted to runner density by a large rectangular hit area.
    function isRaisedFoot(nx, ny) {
      return nearSegment(nx, ny, .50, .50, .39, .58, .078) ||
        nearSegment(nx, ny, .39, .58, .245, .615, .068) ||
        inEllipse(nx, ny, .245, .615, .075, .048);
    }

    function isRunnerSilhouette(nx, ny) {
      return inEllipse(nx, ny, .55, .23, .075, .08) ||
        inEllipse(nx, ny, .52, .39, .115, .17) ||
        nearSegment(nx, ny, .47, .31, .40, .47, .052) ||
        nearSegment(nx, ny, .40, .47, .49, .50, .04) ||
        nearSegment(nx, ny, .59, .33, .68, .40, .045) ||
        isRaisedFoot(nx, ny) ||
        nearSegment(nx, ny, .54, .52, .56, .67, .065) ||
        nearSegment(nx, ny, .56, .67, .69, .76, .055);
    }

    function sample() {
      if (window.RUNNER_PARTICLE_DATA && Array.isArray(window.RUNNER_PARTICLE_DATA.points)) {
        var kindMap = ["sky", "grass", "runner", "field"];
        particles = window.RUNNER_PARTICLE_DATA.points.reduce(function (next, row) {
          var nx = row[0];
          var ny = row[1];
          var kind = kindMap[row[5]] || "field";
          var raisedFoot = isRaisedFoot(nx, ny);

          // The lifted shoe crosses the old x=.30 sampling boundary. Recover
          // the warm/red field samples there and render them as runner points.
          if (kind === "field" && raisedFoot) {
            var footWarm = row[2] > row[3] * 1.045 && row[2] > row[4] * 1.02;
            var footPink = row[2] > 145 && row[4] > 120 && row[3] < row[2] * .96;
            if (footWarm || footPink) kind = "runner";
          }

          // Dark green pixels inside the old runner rectangle are grass, even
          // when they happen to overlap the geometric leg guides.
          var greenGround = ny > .57 && row[3] > row[2] * 1.06 && row[3] > row[4] * 1.06;
          if (kind === "runner" && greenGround) {
            if (row[9] > .34) return next;
            kind = "grass";
          }

          // Version 7 data was generated with a rectangular runner zone. Thin
          // and reclassify its false positives deterministically so the old
          // x=.30 / y=.88 density seam disappears without a new large asset.
          if (kind === "runner" && !isRunnerSilhouette(nx, ny)) {
            var isGround = ny > .57;
            var keepProbability = isGround ? .34 : .14;
            if (row[9] > keepProbability) return next;
            kind = isGround ? "grass" : "field";
          }

          var tx = nx * w;
          var ty = ny * h;
          var displayColor = kind === "runner" ? [row[2], row[3], row[4]] : blendColor(row[2], row[3], row[4], kind);
          next.push({
            tx: tx,
            ty: ty,
            sx: tx - w * (.58 + row[9] * .68),
            sy: ty + (row[9] - .5) * h * .32,
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
            alpha: kind === "runner" ? row[7] : kind === "grass" ? .66 : kind === "sky" ? .58 : .50
          });
          return next;
        }, []);
        document.body.classList.add("particle-ready");
        return;
      }

      var sampleW = Math.round(clamp(w * 1.35, 420, 760));
      var sampleH = Math.round(sampleW * (h / w));
      var off = document.createElement("canvas");
      off.width = sampleW;
      off.height = sampleH;

      var octx = off.getContext("2d", { willReadFrequently: true });
      var zoom = window.innerWidth < 760 ? 1.32 : 1.56;
      var scale = Math.max(sampleW / img.naturalWidth, sampleH / img.naturalHeight) * zoom;
      var drawW = img.naturalWidth * scale;
      var drawH = img.naturalHeight * scale;
      var focalX = .62;
      var focalY = .56;
      var stageX = .64;
      var stageY = .52;
      var dx = sampleW * stageX - img.naturalWidth * focalX * scale;
      var dy = sampleH * stageY - img.naturalHeight * focalY * scale;
      octx.drawImage(img, dx, dy, drawW, drawH);

      var data;
      try {
        data = octx.getImageData(0, 0, sampleW, sampleH).data;
      } catch (err) {
        img.style.opacity = "1";
        return;
      }

      var target = window.innerWidth < 760 ? 13000 : 39000;
      var step = Math.max(2, Math.round(Math.sqrt((sampleW * sampleH) / target)));
      var next = [];

      for (var y = 0; y < sampleH; y += step) {
        for (var x = 0; x < sampleW; x += step) {
          var idx = (y * sampleW + x) * 4;
          var a = data[idx + 3];
          if (a < 40) continue;

          var r = data[idx];
          var g = data[idx + 1];
          var b = data[idx + 2];
          var max = Math.max(r, g, b);
          var min = Math.min(r, g, b);
          var sat = max - min;
          var light = (max + min) / 2;
          var nx = x / sampleW;
          var ny = y / sampleH;
          var magenta = r > 118 && b > 86 && g < 122;
          var warm = r > 118 && r > g * 1.08 && r > b * .88;
          var dark = light < 86;
          var saturated = sat > 48 && light < 205;
          var sky = b > r + 18 && b > g - 8 && light > 108 && sat < 90;
          var grass = ny > .57 && g > r * .86 && g > b * .72 && light < 160;
          var greenGround = ny > .57 && g > r * 1.06 && g > b * 1.06;
          var runner = isRunnerSilhouette(nx, ny) && !greenGround && (magenta || dark || warm || saturated);

          var probability = runner ? .99 : grass ? .34 : sky ? .10 : sat > 44 ? .26 : .10;
          var shirtTorso = runner && magenta && ny < .52;
          var bellyTrim = shirtTorso && nx > .445 && nx < .615 && ny > .30 && ny < .505;
          var frontEdgeTrim = shirtTorso && nx > .535 && nx < .655 && ny > .325 && ny < .47;
          if (bellyTrim) probability *= .34;
          if (frontEdgeTrim) probability *= .46;
          if (Math.random() > probability) continue;

          var kind = runner ? "runner" : grass ? "grass" : sky ? "sky" : "field";
          var color = blendColor(r, g, b, kind);
          var tx = nx * w;
          var ty = ny * h;
          var fromLeft = tx - w * (.58 + Math.random() * .68);
          var fromUp = ty + (Math.random() - .5) * h * .32;

          next.push({
            tx: tx,
            ty: ty,
            sx: fromLeft,
            sy: fromUp,
            nx: nx,
            ny: ny,
            r: color[0],
            g: color[1],
            b: color[2],
            kind: kind,
            raisedFoot: runner && isRaisedFoot(nx, ny),
            phase: Math.random() * Math.PI * 2,
            delay: Math.random() * 520 + nx * 520,
            size: (kind === "runner" ? 1.1 + Math.random() * 1.45 : .7 + Math.random() * 1.05) * (bellyTrim || frontEdgeTrim ? .66 : 1) * (runner && isRaisedFoot(nx, ny) ? 1.18 : 1),
            alpha: (kind === "runner" ? 1 : grass ? .66 : sky ? .58 : .50) * (bellyTrim || frontEdgeTrim ? .76 : 1)
          });
        }
      }

      particles = next;
      document.body.classList.add("particle-ready");
    }

    function drawSpeedLines(time) {
      ctx.save();
      ctx.lineCap = "round";
      for (var i = 0; i < 13; i += 1) {
        var y = h * (.25 + i * .046) + Math.sin(time * 2.4 + i) * 4;
        var x1 = w * (.82 + Math.sin(time + i) * .018);
        var len = w * (.16 + (i % 4) * .025);
        ctx.globalAlpha = .05 + (i % 3) * .018;
        ctx.strokeStyle = i % 3 === 0 ? "#f0652e" : "#164f8b";
        ctx.lineWidth = i % 4 === 0 ? 1.6 : 1;
        ctx.beginPath();
        ctx.moveTo(x1, y);
        ctx.lineTo(x1 - len, y + Math.sin(i) * 5);
        ctx.stroke();
      }
      ctx.restore();
    }

    function drawFrame(now) {
      var elapsed = now - startedAt;
      var intro = reduceMotion ? 1 : clamp(elapsed / 1700, 0, 1);
      var introEase = easeOutCubic(intro);
      var time = now * .001;

      ctx.clearRect(0, 0, w, h);
      drawSpeedLines(time);

      for (var i = 0; i < particles.length; i += 1) {
        var p = particles[i];
        var local = reduceMotion ? 1 : clamp((elapsed - p.delay) / 900, 0, 1);
        var land = easeOutCubic(local) * introEase;
        var x = p.sx + (p.tx - p.sx) * land;
        var y = p.sy + (p.ty - p.sy) * land;
        var alpha = p.alpha * clamp(local + .15, 0, 1);
        var size = p.size;

        if (p.kind === "runner") {
          var stride = Math.sin(time * 5.2 + p.phase);
          var lowerBody = p.ny > .58 ? 1.9 : p.ny > .38 ? 1.05 : .45;
          var pulse = Math.sin(time * 2.5 + p.phase) * .8;
          x += stride * lowerBody * 2.7 + pulse;
          y += Math.cos(time * 5.0 + p.phase) * lowerBody * .85;
        } else if (!reduceMotion) {
          x += Math.sin(time * .9 + p.phase) * (p.kind === "sky" ? .35 : .65);
          y += Math.cos(time * .7 + p.phase) * (p.kind === "grass" ? .55 : .3);
        }

        // Pointer repulsion belongs to the whole particle field, not only the
        // runner. This keeps the background interactive after reclassification.
        if (pointer.active) {
          var dx = x - pointer.x;
          var dy = y - pointer.y;
          var dist = Math.sqrt(dx * dx + dy * dy) || 1;
          var radius = Math.max(82, w * .22);
          if (dist < radius) {
            var push = (1 - dist / radius) * 24;
            x += dx / dist * push;
            y += dy / dist * push;
            size *= 1.2;
            alpha = Math.min(1, alpha + .15);
          }
        }

        if (p.kind === "runner") {
          for (var g = 3; g > 0; g -= 1) {
            ctx.globalAlpha = alpha * (.055 * g);
            ctx.fillStyle = "rgb(" + p.r + "," + p.g + "," + p.b + ")";
            ctx.fillRect(x - g * (7 + lowerBody * 2), y + g * .55, size, size);
          }
        }

        ctx.globalAlpha = alpha;
        ctx.fillStyle = "rgb(" + p.r + "," + p.g + "," + p.b + ")";
        ctx.fillRect(x, y, size, size);
      }

      ctx.globalAlpha = 1;
      if (!reduceMotion) raf = requestAnimationFrame(drawFrame);
    }

    function start() {
      cancelAnimationFrame(raf);
      startedAt = performance.now();
      raf = requestAnimationFrame(drawFrame);
    }

    function rebuild() {
      measure();
      sample();
      start();
    }

    var resizeTimer = 0;
    window.addEventListener("resize", function () {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(rebuild, 180);
    });

    stage.addEventListener("pointermove", function (event) {
      var rect = canvas.getBoundingClientRect();
      pointer.x = event.clientX - rect.left;
      pointer.y = event.clientY - rect.top;
      pointer.active = true;
    });

    stage.addEventListener("pointerleave", function () {
      pointer.active = false;
    });

    document.addEventListener("visibilitychange", function () {
      if (document.hidden) {
        cancelAnimationFrame(raf);
      } else {
        start();
      }
    });

    if (window.RUNNER_PARTICLE_DATA && Array.isArray(window.RUNNER_PARTICLE_DATA.points)) {
      rebuild();
    } else if (img.complete && img.naturalWidth) {
      rebuild();
    } else {
      img.addEventListener("load", rebuild, { once: true });
    }
  }

  document.addEventListener("DOMContentLoaded", function () {
    addReveal();
    initNavSpy();
    initMobileNav();
    initNewsMore();
    initLazyVideos();
    initRunnerParticles();
  });
})();
