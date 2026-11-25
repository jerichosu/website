(function () {
  "use strict";

  var forceSettled = /[?&]settled=1\b/.test(window.location.search);
  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches || forceSettled;

  function initKalmanWidget() {
    var root = document.querySelector(".kalman-playground");
    if (!root) return;

    var canvas = root.querySelector("[data-kalman-canvas]");
    if (!canvas) return;
    var ctx = canvas.getContext("2d");
    if (!ctx) return;

    var gainEl = root.querySelector("[data-kf-gain]");
    var rmseEl = root.querySelector("[data-kf-rmse]");
    var covEl = root.querySelector("[data-kf-cov]");
    var collapseBtn = root.querySelector("[data-kf-collapse]");
    var presetBtns = Array.prototype.slice.call(root.querySelectorAll("[data-kf-preset]"));
    var kfTheme = root.getAttribute("data-kalman-theme") || "telemetry";

    var presets = {
      balanced: { Q: 0.08, R: 2.8, label: "Balanced" },
      "high-r": { Q: 0.025, R: 9.5, label: "High Sensor Noise (R↑)" },
      "high-q": { Q: 0.45, R: 1.1, label: "Agile Tracking (Q↑)" }
    };

    var activePreset = "balanced";
    var Q = presets.balanced.Q;
    var R = presets.balanced.R;

    var N = 150;
    var truthHistory = [];
    var measHistory = [];
    var estHistory = [];
    var sigmaHistory = [];

    var xEst = 0;
    var P = 1.0;
    var K = 0.25;
    var tick = 0;
    var pointerTarget = null;
    var raf = 0;
    var inView = !("IntersectionObserver" in window);

    // Deterministic pseudo-random normal via Box-Muller using seeded LCG for smooth visuals
    var seed = 1337;
    function nextRand() {
      seed = (seed * 1664525 + 1013904223) % 4294967296;
      return seed / 4294967296;
    }

    function nextGaussian() {
      var u1 = Math.max(1e-6, nextRand());
      var u2 = nextRand();
      return Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
    }

    function targetSignal(t) {
      if (pointerTarget !== null) {
        return pointerTarget;
      }
      return Math.sin(t * 0.075) * 0.56 + Math.sin(t * 0.031 + 1.1) * 0.28;
    }

    function stepFilter() {
      tick += 1;
      var truth = targetSignal(tick);
      var noiseStd = Math.sqrt(R) * 0.12;
      var z = truth + nextGaussian() * noiseStd;

      // Predict
      var xPred = xEst;
      var pPred = P + Q * 0.05;

      // Update
      var measVar = R * 0.014;
      K = pPred / (pPred + measVar);
      xEst = xPred + K * (z - xPred);
      P = (1 - K) * pPred;

      truthHistory.push(truth);
      measHistory.push(z);
      estHistory.push(xEst);
      sigmaHistory.push(Math.sqrt(P));

      if (truthHistory.length > N) {
        truthHistory.shift();
        measHistory.shift();
        estHistory.shift();
        sigmaHistory.shift();
      }
    }

    function seedHistory() {
      truthHistory = [];
      measHistory = [];
      estHistory = [];
      sigmaHistory = [];
      xEst = targetSignal(0);
      P = 0.4;
      tick = 0;
      seed = 1337;
      for (var i = 0; i < N; i += 1) {
        stepFilter();
      }
    }

    function computeRMSE() {
      if (!truthHistory.length) return 0;
      var sum = 0;
      for (var i = 0; i < truthHistory.length; i += 1) {
        var diff = truthHistory[i] - estHistory[i];
        sum += diff * diff;
      }
      return Math.sqrt(sum / truthHistory.length);
    }

    function resize() {
      var rect = canvas.getBoundingClientRect();
      var w = Math.max(260, rect.width);
      var h = Math.max(120, rect.height);
      var dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      return { w: w, h: h };
    }

    var dims = resize();

    function draw() {
      var w = dims.w;
      var h = dims.h;
      var isLight = document.documentElement.getAttribute("data-theme") === "light";

      var gridColor, truthColor, measColor, estColor, bandFill;
      if (kfTheme === "editorial") {
        gridColor = "rgba(26, 25, 23, 0.07)";
        truthColor = "rgba(120, 114, 104, 0.58)";
        measColor = "#c9582a";
        estColor = "#184e86";
        bandFill = "rgba(24, 78, 134, 0.12)";
      } else {
        gridColor = isLight ? "rgba(15, 23, 42, 0.08)" : "rgba(148, 163, 184, 0.12)";
        truthColor = isLight ? "rgba(71, 85, 105, 0.55)" : "rgba(148, 163, 184, 0.55)";
        measColor = isLight ? "#d97706" : "#f59e0b";
        estColor = isLight ? "#0284c7" : "#38bdf8";
        bandFill = isLight ? "rgba(2, 132, 199, 0.14)" : "rgba(56, 189, 248, 0.16)";
      }

      ctx.clearRect(0, 0, w, h);

      // Subtle oscilloscope grid
      ctx.strokeStyle = gridColor;
      ctx.lineWidth = 1;
      for (var gy = 1; gy < 4; gy += 1) {
        var yy = Math.round((h * gy) / 4) + 0.5;
        ctx.beginPath();
        ctx.moveTo(0, yy);
        ctx.lineTo(w, yy);
        ctx.stroke();
      }
      for (var gx = 1; gx < 8; gx += 1) {
        var xx = Math.round((w * gx) / 8) + 0.5;
        ctx.beginPath();
        ctx.moveTo(xx, 0);
        ctx.lineTo(xx, h);
        ctx.stroke();
      }

      function toY(val) {
        return h * 0.5 - val * (h * 0.36);
      }

      function toX(idx) {
        return (idx / (N - 1)) * w;
      }

      // 1. ±2σ covariance envelope
      if (estHistory.length > 1) {
        ctx.beginPath();
        for (var i = 0; i < estHistory.length; i += 1) {
          var px = toX(i);
          var pyTop = toY(estHistory[i] + sigmaHistory[i] * 2);
          if (i === 0) ctx.moveTo(px, pyTop);
          else ctx.lineTo(px, pyTop);
        }
        for (var j = estHistory.length - 1; j >= 0; j -= 1) {
          ctx.lineTo(toX(j), toY(estHistory[j] - sigmaHistory[j] * 2));
        }
        ctx.closePath();
        ctx.fillStyle = bandFill;
        ctx.fill();
      }

      // 2. Ground truth dashed line
      ctx.save();
      ctx.setLineDash([4, 4]);
      ctx.strokeStyle = truthColor;
      ctx.lineWidth = 1.3;
      ctx.beginPath();
      for (var t = 0; t < truthHistory.length; t += 1) {
        var tx = toX(t);
        var ty = toY(truthHistory[t]);
        if (t === 0) ctx.moveTo(tx, ty);
        else ctx.lineTo(tx, ty);
      }
      ctx.stroke();
      ctx.restore();

      // 3. Noisy measurements z_k
      ctx.fillStyle = measColor;
      for (var m = 0; m < measHistory.length; m += 1) {
        ctx.globalAlpha = 0.72;
        ctx.beginPath();
        ctx.arc(toX(m), toY(measHistory[m]), 2.1, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;

      // 4. Kalman estimate x_hat_k
      ctx.strokeStyle = estColor;
      ctx.lineWidth = 2.4;
      ctx.lineJoin = "round";
      ctx.beginPath();
      for (var e = 0; e < estHistory.length; e += 1) {
        var ex = toX(e);
        var ey = toY(estHistory[e]);
        if (e === 0) ctx.moveTo(ex, ey);
        else ctx.lineTo(ex, ey);
      }
      ctx.stroke();

      // Current state marker dot
      if (estHistory.length) {
        var lastX = toX(estHistory.length - 1);
        var lastY = toY(estHistory[estHistory.length - 1]);
        ctx.fillStyle = estColor;
        ctx.beginPath();
        ctx.arc(lastX, lastY, 4, 0, Math.PI * 2);
        ctx.fill();
      }

      if (gainEl) gainEl.textContent = K.toFixed(3);
      if (rmseEl) rmseEl.textContent = computeRMSE().toFixed(3);
      if (covEl && sigmaHistory.length) {
        covEl.textContent = "±" + (sigmaHistory[sigmaHistory.length - 1] * 2).toFixed(3);
      }
    }

    var frameCount = 0;
    function loop() {
      if (root.classList.contains("is-collapsed")) {
        raf = 0;
        return;
      }
      frameCount += 1;
      // Advance filter at ~20Hz so waveform moves smoothly and stays readable
      if (frameCount % 3 === 0) {
        stepFilter();
        draw();
      }
      if (!reduceMotion && inView && !document.hidden) {
        raf = requestAnimationFrame(loop);
      } else {
        raf = 0;
      }
    }

    function start() {
      cancelAnimationFrame(raf);
      raf = 0;
      if (root.classList.contains("is-collapsed")) return;
      if (reduceMotion) {
        draw();
        return;
      }
      if (inView && !document.hidden) {
        raf = requestAnimationFrame(loop);
      }
    }

    if (collapseBtn) {
      collapseBtn.addEventListener("click", function () {
        var collapsed = root.classList.toggle("is-collapsed");
        collapseBtn.setAttribute("aria-expanded", collapsed ? "false" : "true");
        collapseBtn.textContent = collapsed ? "Show demo" : "Hide demo";
        if (collapsed) {
          cancelAnimationFrame(raf);
          raf = 0;
        } else {
          dims = resize();
          draw();
          start();
        }
      });
    }

    presetBtns.forEach(function (btn) {
      btn.addEventListener("click", function () {
        var name = btn.getAttribute("data-kf-preset");
        if (!presets[name]) return;
        activePreset = name;
        Q = presets[name].Q;
        R = presets[name].R;
        presetBtns.forEach(function (b) {
          var active = b.getAttribute("data-kf-preset") === activePreset;
          b.classList.toggle("is-active", active);
          b.setAttribute("aria-pressed", active ? "true" : "false");
        });
        if (reduceMotion) {
          seedHistory();
          draw();
        }
      });
    });

    canvas.addEventListener("pointermove", function (event) {
      var rect = canvas.getBoundingClientRect();
      var relY = (event.clientY - rect.top) / Math.max(1, rect.height);
      var clamped = Math.max(-1, Math.min(1, (0.5 - relY) / 0.36));
      pointerTarget = clamped;
    });

    canvas.addEventListener("pointerleave", function () {
      pointerTarget = null;
    });

    window.addEventListener("resize", function () {
      dims = resize();
      draw();
    });

    window.addEventListener("site-theme-change", function () {
      draw();
    });

    document.addEventListener("visibilitychange", function () {
      if (document.hidden) {
        cancelAnimationFrame(raf);
        raf = 0;
      } else {
        start();
      }
    });

    if ("IntersectionObserver" in window) {
      new IntersectionObserver(function (entries) {
        inView = entries[0].isIntersecting;
        if (inView) start();
        else {
          cancelAnimationFrame(raf);
          raf = 0;
        }
      }).observe(canvas);
    }

    seedHistory();
    draw();
    start();
  }

  document.addEventListener("DOMContentLoaded", initKalmanWidget);
})();
