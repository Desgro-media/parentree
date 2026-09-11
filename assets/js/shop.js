/* ============================ shop / catalogue ============================ */
(function () {
  "use strict";
  const $ = (s) => document.querySelector(s);

  const AGE_MAP = {
    "0-3m":  ["0-3m"],
    "3-6m":  ["3-6m"],
    "6-12m": ["6-9m", "9-12m", "6-12m"],
    "12-18m":["12-18m", "1-2y"],
    "18-24m":["18-24m", "1-2y", "2-3y"],
    "2-3y":  ["2-3y"],
  };
  const CAT_COPY = {
    all:        ["All products", "Every Momira piece — GOTS-certified organic cotton, plant-dyed, made to be handed down."],
    nightwear:  ["Night Suits", "Crinkle-muslin and cotton night suits for 6 months to 6 years — loose, breathable, iron-free."],
    frocks:     ["Frocks & Jablas", "Tie-shoulder jablas and knot frocks in single-layer muslin. Open flat, grow with your baby."],
    rompers:    ["Rompers & Sets", "Zip sleepsuits and co-ords for easy changes and easy mornings."],
    bottoms:    ["Joggers & Trousers", "Soft rib-waist bottoms in value 2-packs — the ones you wash twice a week."],
    swaddles:   ["Swaddles", "Generous 120cm organic muslin squares that soften into a second skin."],
    giftsets:   ["Gift Sets", "Coordinated pieces, keepsake box and a card. Every order over ₹2,600 adds a free muslin blanket."],
    essentials: ["Newborn Essentials", "Napkins, wipes, bibs, towels and sheets — the unglamorous heroes of the changing table."],
  };

  const PRICE_MIN = 0, PRICE_MAX = 4000;
  const clampPrice = (raw, fallback) => {
    if (raw === null || raw === undefined || raw === "") return fallback; // Number(null) is 0, not NaN — guard explicitly
    const n = Number(raw);
    return Number.isFinite(n) ? Math.min(PRICE_MAX, Math.max(PRICE_MIN, n)) : fallback;
  };

  const params = new URLSearchParams(location.search);
  let state = {
    cat: params.get("category") || "all",
    age: params.get("age") || "",
    sort: params.get("sort") || "popular",
    q: (params.get("q") || "").toLowerCase(),
    minPrice: clampPrice(params.get("minPrice"), PRICE_MIN),
    maxPrice: clampPrice(params.get("maxPrice"), PRICE_MAX),
  };
  if (!CAT_COPY[state.cat]) state.cat = "all";
  if (state.minPrice > state.maxPrice) [state.minPrice, state.maxPrice] = [state.maxPrice, state.minPrice];
  $("#sortSelect").value = ["popular", "new", "price-asc", "price-desc", "discount"].includes(state.sort) ? state.sort : "popular";

  /* category chips */
  $("#shopCats").innerHTML = window.CATEGORIES.map((c) =>
    `<button class="chip" data-cat="${c.slug}" aria-pressed="${c.slug === state.cat}">${c.label}</button>`
  ).join("");

  function apply() {
    let list = window.byCategory(state.cat).slice();

    if (state.age && AGE_MAP[state.age]) {
      const want = AGE_MAP[state.age];
      list = list.filter((p) => (p.sizes || []).some((s) => want.includes(s)));
    }
    if (state.q) list = list.filter((p) => (p.name + " " + p.cat).toLowerCase().includes(state.q));
    if (state.minPrice > PRICE_MIN || state.maxPrice < PRICE_MAX) {
      list = list.filter((p) => p.price >= state.minPrice && p.price <= state.maxPrice);
    }

    switch (state.sort) {
      case "price-asc":  list.sort((a, b) => a.price - b.price); break;
      case "price-desc": list.sort((a, b) => b.price - a.price); break;
      case "discount":   list.sort((a, b) => b.discount - a.discount); break;
      case "new":        list.sort((a, b) => rank(b) - rank(a)); break;
      default:           list.sort((a, b) => pop(b) - pop(a));
    }

    const [title, desc] = CAT_COPY[state.cat];
    $("#shopTitle").textContent = title;
    $("#shopDesc").textContent = desc;
    $("#crumbNow").textContent = title;
    document.title = title + " — Momira Organic";
    $("#shopCount").textContent = `${list.length} ${list.length === 1 ? "style" : "styles"}`
      + (state.age ? ` · ${state.age.replace("m", " months").replace("y", " years")}` : "");

    $("#shopGrid").innerHTML = list.map((p) => window.productCard(p, { reveal: true })).join("");
    $("#shopEmpty").hidden = list.length > 0;
    $("#shopGrid").hidden = list.length === 0;

    document.querySelectorAll("[data-cat]").forEach((b) =>
      b.setAttribute("aria-pressed", b.dataset.cat === state.cat));

    window.hydrateIcons($("#shopGrid"));
    window.initReveal();

    const u = new URL(location);
    u.search = "";
    if (state.cat !== "all") u.searchParams.set("category", state.cat);
    if (state.age) u.searchParams.set("age", state.age);
    if (state.sort !== "popular") u.searchParams.set("sort", state.sort);
    if (state.q) u.searchParams.set("q", state.q);
    if (state.minPrice > PRICE_MIN) u.searchParams.set("minPrice", state.minPrice);
    if (state.maxPrice < PRICE_MAX) u.searchParams.set("maxPrice", state.maxPrice);
    history.replaceState(null, "", u);
  }

  const pop  = (p) => (/bestseller/i.test(p.badge || "") ? 1000 : 0) + p.reviews + p.rating * 4;
  const rank = (p) => (/(new|trending)/i.test(p.badge || "") ? 500 : 0) + p.reviews;

  document.addEventListener("click", (e) => {
    const chip = e.target.closest("[data-cat]");
    if (!chip) return;
    state.cat = chip.dataset.cat;
    state.age = "";
    window.scrollTo({ top: $(".shop-toolbar").offsetTop - 90, behavior: "smooth" });
    apply();
  });
  $("#sortSelect").addEventListener("change", (e) => { state.sort = e.target.value; apply(); });

  /* -------------------------------------------------------- price filter */
  function initPriceFilter() {
    const btn = $("#priceBtn"), btnLabel = $("#priceBtnLabel"), pricePop = $("#pricePop");
    const minInput = $("#priceMin"), maxInput = $("#priceMax");
    const minLabel = $("#priceMinLabel"), maxLabel = $("#priceMaxLabel");
    const fill = $("#priceFill");
    const presets = [...document.querySelectorAll(".price-pop__presets button")];

    const syncUI = () => {
      minInput.value = state.minPrice;
      maxInput.value = state.maxPrice;
      minLabel.textContent = state.minPrice.toLocaleString("en-IN");
      maxLabel.textContent = state.maxPrice === PRICE_MAX ? `${PRICE_MAX.toLocaleString("en-IN")}+` : state.maxPrice.toLocaleString("en-IN");
      const left = (state.minPrice / PRICE_MAX) * 100;
      const right = (state.maxPrice / PRICE_MAX) * 100;
      fill.style.left = left + "%";
      fill.style.width = Math.max(0, right - left) + "%";
      const filtered = state.minPrice > PRICE_MIN || state.maxPrice < PRICE_MAX;
      btn.classList.toggle("is-active", filtered);
      btnLabel.textContent = filtered
        ? `₹${state.minPrice.toLocaleString("en-IN")}–${state.maxPrice === PRICE_MAX ? PRICE_MAX.toLocaleString("en-IN") + "+" : state.maxPrice.toLocaleString("en-IN")}`
        : "Price";
      presets.forEach((b) => {
        const [pmin, pmax] = b.dataset.preset.split(",").map(Number);
        b.classList.toggle("is-active", pmin === state.minPrice && pmax === state.maxPrice);
      });
    };

    const openPop = () => { pricePop.hidden = false; btn.setAttribute("aria-expanded", "true"); };
    const closePop = () => { pricePop.hidden = true; btn.setAttribute("aria-expanded", "false"); };

    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      pricePop.hidden ? openPop() : closePop();
    });
    document.addEventListener("click", (e) => {
      if (!pricePop.hidden && !pricePop.contains(e.target) && e.target !== btn) closePop();
    });
    document.addEventListener("keydown", (e) => { if (e.key === "Escape") closePop(); });

    const liveDrag = (which) => {
      // keep the two handles from crossing — no minimum gap required
      let mn = Number(minInput.value), mx = Number(maxInput.value);
      if (which === "min" && mn > mx) { mn = mx; minInput.value = mn; }
      if (which === "max" && mx < mn) { mx = mn; maxInput.value = mx; }
      state.minPrice = mn; state.maxPrice = mx;
      syncUI();
    };
    minInput.addEventListener("input", () => liveDrag("min"));
    maxInput.addEventListener("input", () => liveDrag("max"));
    minInput.addEventListener("change", apply);
    maxInput.addEventListener("change", apply);

    presets.forEach((b) => b.addEventListener("click", () => {
      const [pmin, pmax] = b.dataset.preset.split(",").map(Number);
      state.minPrice = pmin; state.maxPrice = pmax;
      syncUI(); apply();
    }));

    $("#priceReset").addEventListener("click", () => {
      state.minPrice = PRICE_MIN; state.maxPrice = PRICE_MAX;
      syncUI(); apply(); closePop();
    });

    syncUI();
  }

  document.addEventListener("chrome:ready", () => { initPriceFilter(); apply(); }, { once: true });
})();
