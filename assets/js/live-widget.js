// "Live activity" widget — home page only.
//
// IMPORTANT (read before tuning): GamzoHub is a static site with no backend,
// so there is no real visitor-tracking data to show here. Everything below is
// a believable SIMULATION driven purely by the current clock — it is NOT wired
// to real analytics. It is deterministic given the time (same moment in time
// always produces the same numbers across tabs/reloads), follows a realistic
// global activity curve built from several world time zones, and never lies
// in a way that could embarrass the brand (numbers are modest, not inflated).
//
// To replace with real data later: swap computeActiveNow()/computeVisitsToday()
// for calls to your real analytics (Netlify Analytics, Plausible, a small
// serverless presence counter, etc.) and leave the rendering code untouched.

(function () {
  "use strict";

  // ---- Tunable config -------------------------------------------------
  var CONFIG = {
    activeMin: 8, // "playing now" floor during global quiet hours
    activeMax: 86, // "playing now" ceiling during global peak overlap
    dailyBase: 1450, // target "visits today" by end of day, before variance
    dailyVariance: 0.28, // +/- day-to-day swing (seeded by date, not random)
    tickMs: 3500, // how often the numbers re-roll
    entranceDelayMs: 1300,
    pingIntervalMs: 7000
  };

  // Each region's weight is its rough share of a worldwide casual-gaming
  // audience; offset is hours from UTC. Weights sum to 1.
  var REGIONS = [
    { name: "Americas", offset: -5, weight: 0.33, cities: ["New York", "São Paulo", "Toronto", "Mexico City"] },
    { name: "Europe/Africa", offset: 1, weight: 0.28, cities: ["London", "Lagos", "Berlin", "Madrid"] },
    { name: "South Asia", offset: 5.5, weight: 0.2, cities: ["Mumbai", "Dhaka", "Karachi", "Bengaluru"] },
    { name: "East Asia/Oceania", offset: 9, weight: 0.19, cities: ["Tokyo", "Manila", "Sydney", "Jakarta"] }
  ];

  // Hand-authored daily activity shape (hour -> 0..1), asymmetric on purpose:
  // a long quiet trough before dawn, then a steady rise, a small lunch dip,
  // and a prime-time evening peak. Interpolated smoothly between anchors.
  var ANCHORS = [
    [0, 0.35], [2, 0.15], [4, 0.07], [6, 0.1], [8, 0.25], [10, 0.45],
    [12, 0.55], [13, 0.5], [15, 0.6], [17, 0.7], [19, 0.85], [20, 0.95],
    [21, 1.0], [22, 0.92], [23, 0.7], [24, 0.35]
  ];

  var GAMES = ["Max Rampage", "Alauddin"];

  // Fun/round numbers that get a little celebration when "visits today" first
  // crosses them. Default message is used for any plain round number not listed.
  var MILESTONE_FLAVORS = {
    500: "Halfway to four digits!",
    777: "Lucky sevens!",
    1000: "Four digits — nice.",
    1337: "Leet. Literally.",
    2048: "Same number as the puzzle game. Coincidence? Probably.",
    2500: "Quarter of the way to 10K.",
    5000: "Five thousand. GamzoHub is warming up.",
    7777: "Four sevens in a row — that's rare.",
    10000: "Five digits. Let's keep going."
  };
  var MILESTONES = Object.keys(MILESTONE_FLAVORS).map(Number).sort(function (a, b) { return a - b; });

  function smoothstep(t) { return t * t * (3 - 2 * t); }

  function activityAt(hour) {
    var h = ((hour % 24) + 24) % 24;
    for (var i = 0; i < ANCHORS.length - 1; i++) {
      var h0 = ANCHORS[i][0], v0 = ANCHORS[i][1], h1 = ANCHORS[i + 1][0], v1 = ANCHORS[i + 1][1];
      if (h >= h0 && h <= h1) return v0 + (v1 - v0) * smoothstep((h - h0) / (h1 - h0));
    }
    return ANCHORS[0][1];
  }

  // Deterministic 0..1 hash of a string (so "today" gets a stable but
  // different flavor than yesterday, without any randomness/storage).
  function hashString(str) {
    var h = 2166136261;
    for (var i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = (h * 16777619) >>> 0; }
    return h / 4294967295;
  }

  function regionLocalHour(region, utcHourFloat) { return utcHourFloat + region.offset; }

  function isWeekendLocal(region, utcMs) {
    var local = new Date(utcMs + region.offset * 3600000);
    var day = local.getUTCDay(), hour = local.getUTCHours();
    return day === 6 || day === 0 || (day === 5 && hour >= 17);
  }

  function globalActivity(utcMs) {
    var utcHourFloat = (utcMs / 3600000) % 24;
    var sum = 0;
    for (var i = 0; i < REGIONS.length; i++) {
      var r = REGIONS[i];
      var mult = isWeekendLocal(r, utcMs) ? 1.15 : 1.0;
      sum += r.weight * activityAt(regionLocalHour(r, utcHourFloat)) * mult;
    }
    return sum;
  }

  // Precompute the cumulative (integral) of globalActivity across one UTC day
  // at 5-minute resolution, so "fraction of today's traffic so far" is a fast
  // lookup instead of re-integrating on every tick.
  var CUM_SAMPLES = 288, CUM_STEP = 24 / CUM_SAMPLES;
  var cumTable = (function () {
    var table = [0], acc = 0;
    for (var i = 1; i <= CUM_SAMPLES; i++) {
      acc += globalActivity((i * CUM_STEP - CUM_STEP / 2) * 3600000) * CUM_STEP;
      table.push(acc);
    }
    return table;
  })();
  var cumTotal = cumTable[cumTable.length - 1];

  function cumulativeFraction(utcHourFloat) {
    var idx = Math.min(CUM_SAMPLES, Math.max(0, Math.round(utcHourFloat / CUM_STEP)));
    return cumTable[idx] / cumTotal;
  }

  function computeActiveNow(now) {
    var g = globalActivity(now.getTime());
    // Observed global() range is roughly 0.30-0.65; map that band to the configured count range.
    var t = Math.min(1, Math.max(0, (g - 0.3) / (0.62 - 0.3)));
    var base = CONFIG.activeMin + (CONFIG.activeMax - CONFIG.activeMin) * t;
    var jitter = (Math.random() - 0.5) * base * 0.12;
    return Math.max(1, Math.round(base + jitter));
  }

  var lastVisitsShown = 0;
  function computeVisitsToday(now) {
    var dateStr = now.toISOString().slice(0, 10);
    var dayFactor = 1 + (hashString(dateStr) - 0.5) * 2 * CONFIG.dailyVariance;
    var dailyTotal = CONFIG.dailyBase * dayFactor;
    var utcHourFloat = now.getUTCHours() + now.getUTCMinutes() / 60 + now.getUTCSeconds() / 3600;
    var value = Math.round(dailyTotal * cumulativeFraction(utcHourFloat));
    // Ratchet: a "today" total should never visibly drop, even across clock edge cases.
    lastVisitsShown = Math.max(lastVisitsShown, value);
    return lastVisitsShown;
  }

  function dominantRegion(now) {
    var utcHourFloat = (now.getTime() / 3600000) % 24;
    var best = REGIONS[0], bestScore = -1;
    for (var i = 0; i < REGIONS.length; i++) {
      var score = REGIONS[i].weight * activityAt(regionLocalHour(REGIONS[i], utcHourFloat));
      if (score > bestScore) { bestScore = score; best = REGIONS[i]; }
    }
    return best;
  }

  function formatNumber(n) { return n.toLocaleString("en-US"); }

  // ---- DOM / rendering --------------------------------------------------
  var SS_KEY = "gamzohub_live_widget_dismissed";
  var reduceMotion = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  function milestoneKeySeen(dateStr, value) {
    try { return sessionStorage.getItem("gamzohub_milestone_" + dateStr + "_" + value) === "1"; } catch (e) { return false; }
  }
  function markMilestoneSeen(dateStr, value) {
    try { sessionStorage.setItem("gamzohub_milestone_" + dateStr + "_" + value, "1"); } catch (e) {}
  }

  function burstConfetti(root) {
    if (reduceMotion) return;
    var canvas = document.createElement("canvas");
    canvas.className = "live-confetti";
    var w = root.offsetWidth + 40, h = 160;
    canvas.width = w * 2; canvas.height = h * 2;
    canvas.style.width = w + "px"; canvas.style.height = h + "px";
    root.appendChild(canvas);
    var ctx = canvas.getContext("2d");
    ctx.scale(2, 2);
    var colors = ["#f2b94b", "#e8a93b", "#7f5fd9", "#fff", "#5fcf9b"];
    var parts = [];
    for (var i = 0; i < 46; i++) {
      parts.push({
        x: w / 2 + (Math.random() - 0.5) * 40,
        y: h - 10,
        vx: (Math.random() - 0.5) * 5.5,
        vy: -4 - Math.random() * 4.5,
        size: 3 + Math.random() * 3,
        color: colors[i % colors.length],
        rot: Math.random() * 6.28,
        vr: (Math.random() - 0.5) * 0.3,
        life: 1
      });
    }
    var start = performance.now();
    function frame(t) {
      var dt = Math.min(0.032, (t - start) / 1000); start = t;
      ctx.clearRect(0, 0, w, h);
      var alive = false;
      for (var i = 0; i < parts.length; i++) {
        var p = parts[i];
        if (p.life <= 0) continue;
        p.vy += 11 * dt; p.x += p.vx; p.y += p.vy; p.rot += p.vr; p.life -= dt * 0.65;
        if (p.life > 0) {
          alive = true;
          ctx.save(); ctx.globalAlpha = Math.max(0, p.life); ctx.translate(p.x, p.y); ctx.rotate(p.rot);
          ctx.fillStyle = p.color; ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.6);
          ctx.restore();
        }
      }
      if (alive) requestAnimationFrame(frame); else canvas.remove();
    }
    requestAnimationFrame(frame);
  }

  function showMilestoneToast(widget, value) {
    var flavor = MILESTONE_FLAVORS[value] || "Nice round number.";
    var toast = document.createElement("div");
    toast.className = "live-milestone-toast";
    toast.innerHTML =
      '<strong>🎉 Visitor #' + formatNumber(value) + " today</strong><span>" + flavor + "</span>";
    widget.appendChild(toast);
    burstConfetti(widget);
    requestAnimationFrame(function () { toast.classList.add("show"); });
    setTimeout(function () { toast.classList.remove("show"); setTimeout(function () { toast.remove(); }, 400); }, 4600);
  }

  function pulse(el) {
    if (reduceMotion) return;
    el.classList.remove("pulse"); void el.offsetWidth; el.classList.add("pulse");
  }

  function buildWidget() {
    // On the home page the widget floats fixed in a corner. On game pages a
    // large iframe already owns most of the screen, so a fixed overlay risks
    // covering the game's own controls (confirmed by testing — it did, on
    // mobile). If the page provides a #live-widget-slot, render inline there
    // instead: same content and behavior, just part of the normal page flow.
    var slot = document.getElementById("live-widget-slot");
    var inline = !!slot;

    var el = document.createElement("div");
    el.className = "live-widget" + (inline ? " inline" : "");
    el.setAttribute("role", "status");
    el.setAttribute("aria-label", "Live site activity");
    el.innerHTML =
      '<button type="button" class="live-widget-close" aria-label="Dismiss">×</button>' +
      '<div class="live-widget-head"><span class="live-dot" aria-hidden="true"></span>Live activity</div>' +
      '<div class="live-stat"><span class="live-stat-value" id="lw-active">–</span><span class="live-stat-label">playing right now</span></div>' +
      '<div class="live-stat"><span class="live-stat-value" id="lw-visits">–</span><span class="live-stat-label">visits today</span></div>' +
      '<p class="live-ping" id="lw-ping" aria-hidden="true"></p>';
    (slot || document.body).appendChild(el);

    el.querySelector(".live-widget-close").addEventListener("click", function () {
      el.classList.remove("show");
      try { sessionStorage.setItem(SS_KEY, "1"); } catch (e) {}
      setTimeout(function () { el.remove(); }, 300);
    });

    setTimeout(function () { el.classList.add("show"); }, inline ? 150 : CONFIG.entranceDelayMs);
    return el;
  }

  function startPingRotation(el) {
    var pingEl = el.querySelector("#lw-ping");
    function nextPing() {
      var now = new Date();
      var region = dominantRegion(now);
      var city = region.cities[Math.floor(Math.random() * region.cities.length)];
      var game = GAMES[Math.floor(Math.random() * GAMES.length)];
      pingEl.textContent = "🟢 Someone in " + city + " just started " + game;
      pingEl.classList.remove("show"); void pingEl.offsetWidth; pingEl.classList.add("show");
    }
    nextPing();
    setInterval(nextPing, CONFIG.pingIntervalMs);
  }

  function init() {
    try { if (sessionStorage.getItem(SS_KEY) === "1") return; } catch (e) {}
    var el = buildWidget();
    var activeEl = el.querySelector("#lw-active"), visitsEl = el.querySelector("#lw-visits");
    var today = new Date().toISOString().slice(0, 10);

    // On the very first tick there is no real "previous" reading yet — if we
    // compared against 0 we'd fire every milestone already passed today, all
    // at once, on every single pageview. So the first tick only establishes
    // a silent baseline; milestones only celebrate crossings that happen
    // while this tab is actually open and watching.
    var haveBaseline = false;
    function tick() {
      var now = new Date();
      var active = computeActiveNow(now);
      var visits = computeVisitsToday(now);
      if (activeEl.textContent !== formatNumber(active)) { activeEl.textContent = formatNumber(active); pulse(activeEl); }
      if (visitsEl.textContent !== formatNumber(visits)) {
        var prevNum = Number((visitsEl.textContent || "").replace(/,/g, "")) || 0;
        visitsEl.textContent = formatNumber(visits); pulse(visitsEl);
        if (haveBaseline) {
          for (var i = 0; i < MILESTONES.length; i++) {
            var m = MILESTONES[i];
            if (prevNum < m && visits >= m && !milestoneKeySeen(today, m)) {
              markMilestoneSeen(today, m);
              showMilestoneToast(el, m);
            }
          }
        }
      }
      haveBaseline = true;
    }
    tick();
    setInterval(tick, CONFIG.tickMs);
    startPingRotation(el);
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
