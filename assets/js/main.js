// Shared site behavior: mobile nav toggle + active link highlighting.
(function () {
  const toggle = document.querySelector(".nav-toggle");
  const mobileNav = document.querySelector(".nav-mobile");
  if (toggle && mobileNav) {
    toggle.addEventListener("click", function () {
      const isOpen = mobileNav.classList.toggle("open");
      toggle.setAttribute("aria-expanded", String(isOpen));
      document.body.style.overflow = isOpen ? "hidden" : "";
    });
    mobileNav.querySelectorAll("a").forEach(function (link) {
      link.addEventListener("click", function () {
        mobileNav.classList.remove("open");
        toggle.setAttribute("aria-expanded", "false");
        document.body.style.overflow = "";
      });
    });
  }

  // Mark the current page's nav link for styling + screen readers.
  const path = window.location.pathname.replace(/\/$/, "") || "/";
  document.querySelectorAll(".nav-desktop a, .nav-mobile a").forEach(function (link) {
    const linkPath = link.getAttribute("href").replace(/\/$/, "") || "/";
    if (linkPath === path) {
      link.setAttribute("aria-current", "page");
    }
  });
})();

// Builds a game card's DOM. Shared by home grid, category grid, related strip.
function gamzohubCreateCard(game) {
  const isLocked = game.status !== "live";
  const article = document.createElement("article");
  article.className = "game-card" + (isLocked ? " is-locked" : "");

  const badge = game.tags && game.tags.includes("trending")
    ? '<span class="badge trending">Trending</span>'
    : game.tags && game.tags.includes("new")
    ? '<span class="badge">New</span>'
    : isLocked
    ? '<span class="badge soon">Coming soon</span>'
    : "";

  const overlaySvg =
    '<svg viewBox="0 0 24 24" fill="#fff" aria-hidden="true"><path d="M8 5v14l11-7z"/></svg>';
  const inner =
    '<div class="thumb-wrap">' +
    badge +
    '<img src="' + game.thumbnail + '" alt="" loading="lazy" width="320" height="240">' +
    (isLocked ? "" : '<div class="play-overlay">' + overlaySvg + "</div>") +
    "</div>" +
    '<div class="card-body">' +
    "<h3>" + game.title + "</h3>" +
    '<span class="cat-tag">' + game.category + "</span>" +
    (isLocked ? '<p class="card-desc">' + game.description + "</p>" : "") +
    "</div>";

  article.innerHTML = isLocked
    ? '<div class="card-link">' + inner + "</div>"
    : '<a class="card-link" href="/play/' + game.slug + '/" aria-label="Play ' + game.title + '">' + inner + "</a>";
  return article;
}

// Lightweight star rating widget backed by localStorage (per-browser, no backend).
function gamzohubInitRatingWidget(root, gameSlug) {
  if (!root) return;
  const key = "gamzohub_rating_" + gameSlug;
  const stars = root.querySelectorAll(".stars button");
  const summary = root.querySelector(".rating-summary");
  let current = Number(localStorage.getItem(key)) || 0;

  function render() {
    stars.forEach(function (btn) {
      const val = Number(btn.dataset.value);
      btn.classList.toggle("filled", val <= current);
      btn.setAttribute("aria-pressed", String(val === current));
    });
    summary.textContent = current
      ? "You rated this " + current + " / 5"
      : "Rate this game";
  }

  stars.forEach(function (btn) {
    btn.addEventListener("click", function () {
      current = Number(btn.dataset.value);
      try {
        localStorage.setItem(key, String(current));
      } catch (e) {
        /* storage unavailable (private mode) — rating just won't persist */
      }
      render();
    });
  });

  render();
}
