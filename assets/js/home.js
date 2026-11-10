// Renders game listings: home rows (#live-row, #soon-row) and the searchable grid on /games/.
(function () {
  const games = window.GAMZOHUB_GAMES || [];
  const categories = window.GAMZOHUB_CATEGORIES || [];

  const liveRow = document.getElementById("live-row");
  const soonRow = document.getElementById("soon-row");
  if (liveRow) games.filter((g) => g.status === "live").forEach((g) => liveRow.appendChild(gamzohubCreateCard(g)));
  if (soonRow) games.filter((g) => g.status !== "live").forEach((g) => soonRow.appendChild(gamzohubCreateCard(g)));

  const grid = document.getElementById("all-games-grid");
  if (!grid) return;
  const pillsWrap = document.getElementById("category-pills");
  const searchInput = document.getElementById("game-search");
  const emptyState = document.getElementById("empty-state");
  const used = new Set(games.map((g) => g.category));
  let activeCategory = "all";

  function renderGrid() {
    const term = searchInput ? searchInput.value.trim().toLowerCase() : "";
    const filtered = games.filter((g) => {
      const matchesCategory = activeCategory === "all" || g.category === activeCategory;
      const matchesTerm = !term || g.title.toLowerCase().includes(term) || g.description.toLowerCase().includes(term);
      return matchesCategory && matchesTerm;
    });
    grid.innerHTML = "";
    filtered.forEach((g) => grid.appendChild(gamzohubCreateCard(g)));
    if (emptyState) emptyState.hidden = filtered.length !== 0;
  }

  if (pillsWrap) {
    const addPill = (label, slug) => {
      const pill = document.createElement("button");
      pill.className = "pill";
      pill.type = "button";
      pill.textContent = label;
      pill.dataset.category = slug;
      pill.setAttribute("aria-pressed", String(slug === "all"));
      pillsWrap.appendChild(pill);
    };
    addPill("All games", "all");
    categories.filter((c) => used.has(c.slug)).forEach((c) => addPill(c.label, c.slug));

    pillsWrap.addEventListener("click", function (e) {
      const btn = e.target.closest(".pill");
      if (!btn) return;
      pillsWrap.querySelectorAll(".pill").forEach((p) => p.setAttribute("aria-pressed", "false"));
      btn.setAttribute("aria-pressed", "true");
      activeCategory = btn.dataset.category;
      renderGrid();
    });
  }
  if (searchInput) searchInput.addEventListener("input", renderGrid);
  renderGrid();
})();
