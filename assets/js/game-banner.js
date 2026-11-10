// Home page hero: a swipeable/scrollable storytelling banner for every LIVE
// game (not "coming soon" ones — they don't have a real game or story yet,
// so featuring them here would be misleading). Built from games-data.js so
// a new game with a `banner` object just appears here automatically.
(function () {
  "use strict";
  var mount = document.getElementById("game-banner");
  if (!mount) return;

  var games = (window.GAMZOHUB_GAMES || []).filter(function (g) { return g.status === "live" && g.banner; });
  if (!games.length) { mount.remove(); return; }

  var reduceMotion = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var AUTOPLAY_MS = 7000;
  var INTERACTION_COOLDOWN_MS = 5500;

  function catLabel(slug) {
    var c = (window.GAMZOHUB_CATEGORIES || []).find(function (x) { return x.slug === slug; });
    return c ? c.label : slug;
  }

  mount.innerHTML =
    '<div class="banner-track" id="banner-track"></div>' +
    (games.length > 1
      ? '<button type="button" class="banner-arrow prev" aria-label="Previous game">&#8249;</button>' +
        '<button type="button" class="banner-arrow next" aria-label="Next game">&#8250;</button>' +
        '<div class="banner-dots" id="banner-dots"></div>'
      : "");

  var track = mount.querySelector("#banner-track");
  var dotsWrap = mount.querySelector("#banner-dots");
  var slides = [];

  games.forEach(function (g, i) {
    var slide = document.createElement("article");
    slide.className = "banner-slide";
    slide.style.backgroundImage = "url('" + g.banner.art + "')";
    slide.innerHTML =
      '<div class="banner-content"><div class="container">' +
      '<span class="banner-badge">' + catLabel(g.category) + "</span>" +
      "<h2 class=\"banner-title\">" + g.title + "</h2>" +
      '<p class="banner-tagline">' + g.banner.tagline + "</p>" +
      '<p class="banner-story">' + g.banner.story + "</p>" +
      '<div class="banner-meta">Free &middot; No download &middot; Desktop &amp; mobile</div>' +
      '<div class="banner-actions">' +
      '<a class="btn btn-primary" href="/play/' + g.slug + '/">Play ' + g.title + " now</a>" +
      '<a class="btn btn-ghost" href="/games/">All games</a>' +
      "</div></div></div>";
    track.appendChild(slide);
    slides.push(slide);

    if (dotsWrap) {
      var dot = document.createElement("button");
      dot.type = "button";
      dot.className = "banner-dot";
      dot.setAttribute("aria-label", "Show " + g.title);
      dot.addEventListener("click", function () { goTo(i); });
      dotsWrap.appendChild(dot);
    }
  });

  var dots = dotsWrap ? Array.prototype.slice.call(dotsWrap.children) : [];
  var current = 0;
  var lastInteraction = 0;

  function setActive(i) {
    current = i;
    dots.forEach(function (d, di) { d.classList.toggle("is-active", di === i); });
  }

  function goTo(i) {
    var n = slides.length;
    var idx = ((i % n) + n) % n;
    slides[idx].scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", inline: "start", block: "nearest" });
    setActive(idx);
    lastInteraction = Date.now();
  }

  if (slides.length > 1) {
    mount.querySelector(".banner-arrow.prev").addEventListener("click", function () { goTo(current - 1); });
    mount.querySelector(".banner-arrow.next").addEventListener("click", function () { goTo(current + 1); });

    ["pointerdown", "touchstart", "wheel"].forEach(function (ev) {
      track.addEventListener(ev, function () { lastInteraction = Date.now(); }, { passive: true });
    });

    if ("IntersectionObserver" in window) {
      var io = new IntersectionObserver(
        function (entries) {
          entries.forEach(function (entry) {
            if (entry.isIntersecting && entry.intersectionRatio > 0.6) {
              var idx = slides.indexOf(entry.target);
              if (idx >= 0) setActive(idx);
            }
          });
        },
        { root: track, threshold: [0.6] }
      );
      slides.forEach(function (s) { io.observe(s); });
    }

    if (!reduceMotion) {
      setInterval(function () {
        if (Date.now() - lastInteraction < INTERACTION_COOLDOWN_MS) return;
        goTo(current + 1);
      }, AUTOPLAY_MS);
    }
  }

  setActive(0);
})();
