/* ========================== homepage renderers ========================== */
(function () {
  "use strict";
  const $ = (s) => document.querySelector(s);
  const set = (sel, html) => { const el = $(sel); if (el) el.innerHTML = html; };

  /* hero rating */
  { const h = $("[data-hero-stars]"); if (h) h.replaceWith(el(window.stars(5, 11))); }
  function el(html) { const t = document.createElement("template"); t.innerHTML = html.trim(); return t.content.firstChild; }

  /* category rail — quick links into shop */
  const cats = window.CATEGORIES.filter((c) => c.slug !== "all");
  set("#catRail",
    `<a class="chip is-active" href="shop.html?sort=popular">${window.icon("sparkle")} Bestsellers</a>` +
    cats.map((c) => `<a class="chip" href="shop.html?category=${c.slug}">${c.label}</a>`).join("")
  );

  /* best sellers grid — most-loved, capped at 2 per category for variety */
  const perCat = {};
  const best = window.PRODUCTS
    .slice()
    .sort((a, b) => (/bestseller/i.test(b.badge || "") - /bestseller/i.test(a.badge || "")) || (b.reviews - a.reviews))
    .filter((p) => { perCat[p.cat] = (perCat[p.cat] || 0) + 1; return perCat[p.cat] <= 2; })
    .slice(0, 8);
  set("#bestGrid", best.map((p) => window.productCard(p, { reveal: true })).join(""));

  /* collection tiles */
  set("#collectionGrid", window.COLLECTIONS.map((c) => `
    <a class="tile" href="shop.html?category=${c.slug}">
      <img src="${c.img}" alt="${c.title}" loading="lazy">
      <span class="tile__label">${c.title} ${window.icon("arrowRight")}</span>
    </a>`).join(""));

  /* age grid */
  set("#ageGrid", window.AGES.map((a) => `
    <a class="age-card" href="shop.html?age=${a.slug}">
      <span class="age-card__img"><img src="${a.img}" alt="${a.title}" loading="lazy"></span>
      <span>${a.title}</span>
    </a>`).join(""));

  /* testimonials */
  set("#testiGrid", window.TESTIMONIALS.map((t) => `
    <figure class="testi reveal">
      ${window.stars(5)}
      <blockquote class="testi__quote">“${t.text}”</blockquote>
      <figcaption class="testi__who">
        <span class="testi__avatar">${t.name.split(" ").map((w) => w[0]).slice(0, 2).join("")}</span>
        <span><b>${t.name}</b><span>${t.city} · Verified buyer</span></span>
      </figcaption>
    </figure>`).join(""));

  /* instagram */
  const ig = ["products/fr-rainbow-bubbles.jpg","lifestyle/l3-crop.jpg","products/nw-fruit-grid.jpg","products/sw-citrus-bloom.jpg",
    "products/fr-nature-tales.jpg","products/nw-soft-sage.jpg","products/es-head-pillow.jpg","lifestyle/l4-crop.jpg",
    "products/gs-17pcs.jpg","products/bt-joggers-earthy.jpg","products/nw-mango-mood.jpg","products/sw-soft-polka.jpg"];
  set("#igGrid", ig.map((src) => `
    <a href="https://instagram.com" aria-label="Instagram post">
      <img src="assets/img/${src}" alt="" loading="lazy">${window.icon("instagram")}
    </a>`).join(""));

  /* newsletter */
  const form = $("[data-newsletter]");
  if (form) form.addEventListener("submit", (e) => {
    e.preventDefault();
    form.reset();
    window.toast("You’re in — check your inbox for 10% off.");
  });

  window.hydrateIcons(document.querySelector("main"));
  window.initReveal();
})();
