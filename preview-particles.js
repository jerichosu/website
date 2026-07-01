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
          Math.round(r * .56 + 244 * .44),
          Math.round(g * .58 + 239 * .42),
          Math.round(b * .70 + 230 * .30)
        ];
      }
      if (kind === "grass") {
        return [
          Math.round(r * .46 + 42 * .54),
          Math.round(g * .54 + 67 * .46),
          Math.round(b * .42 + 52 * .58)
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

    function sample() {
      if (window.RUNNER_PARTICLE_DATA && Array.isArray(window.RUNNER_PARTICLE_DATA.points)) {
        var kindMap = ["sky", "grass", "runner", "field"];
        particles = window.RUNNER_PARTICLE_DATA.points.map(function (row) {
          var nx = row[0];
          var ny = row[1];
          var tx = nx * w;
          var ty = ny * h;
          return {
            tx: tx,
            ty: ty,
            sx: tx - w * (.58 + row[9] * .68),
            sy: ty + (row[9] - .5) * h * .32,
            nx: nx,
            ny: ny,
            r: row[2],
            g: row[3],
            b: row[4],
            kind: kindMap[row[5]] || "field",
            phase: row[8],
            delay: row[9] * 520 + nx * 520,
            size: row[6],
            alpha: row[7]
          };
        });
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
          var runnerZone = nx > .30 && nx < .96 && ny > .18 && ny < .88;
          var magenta = r > 118 && b > 86 && g < 122;
          var warm = r > 118 && r > g * 1.08 && r > b * .88;
          var dark = light < 86;
          var saturated = sat > 48 && light < 205;
          var sky = b > r + 18 && b > g - 8 && light > 108 && sat < 90;
          var grass = ny > .57 && g > r * .86 && g > b * .72 && light < 160;
          var runner = runnerZone && (magenta || dark || warm || saturated);

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
            phase: Math.random() * Math.PI * 2,
            delay: Math.random() * 520 + nx * 520,
            size: (kind === "runner" ? 1.1 + Math.random() * 1.45 : .7 + Math.random() * 1.05) * (bellyTrim || frontEdgeTrim ? .66 : 1),
            alpha: (kind === "runner" ? 1 : grass ? .5 : sky ? .32 : .46) * (bellyTrim || frontEdgeTrim ? .76 : 1)
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

          for (var g = 3; g > 0; g -= 1) {
            ctx.globalAlpha = alpha * (.055 * g);
            ctx.fillStyle = "rgb(" + p.r + "," + p.g + "," + p.b + ")";
            ctx.fillRect(x - g * (7 + lowerBody * 2), y + g * .55, size, size);
          }
        } else if (!reduceMotion) {
          x += Math.sin(time * .9 + p.phase) * (p.kind === "sky" ? .35 : .65);
          y += Math.cos(time * .7 + p.phase) * (p.kind === "grass" ? .55 : .3);
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
    initRunnerParticles();
  });
})();
