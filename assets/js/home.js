/* ========================== homepage renderers ========================== */
(function () {
  "use strict";
  const $ = (s) => document.querySelector(s);
  const set = (sel, html) => { const el = $(sel); if (el) el.innerHTML = html; };

  /* the hero slideshow starts straight away — it never waits on the catalogue fetch */
  document.querySelectorAll("[data-slideshow]").forEach(initSlideshow);

  Promise.all([
    window.Catalog && window.Catalog.ready,
    window.Reviews && window.Reviews.ready,
  ]).then(main);

  /* Generic fade slideshow (currently the hero).
     Markup contract: a [data-slideshow] root containing a [data-slideshow-stage]
     whose children are the slides (the visible one has .is-active). Controls are
     built here, so with JS off the first slide simply shows on its own.

     Autoplay is driven by the active dot's CSS fill animation: `animationend`
     advances the slide, so hover/focus pause is pure CSS and the timer can never
     drift from what the dot shows. Reduced-motion users get no autoplay at all —
     the global reduced-motion rule shortens animations to ~0s, which would otherwise
     flip slides in a blur. */
  function initSlideshow(root) {
    if (root.dataset.ssReady) return;
    const stage = root.querySelector("[data-slideshow-stage]");
    const slides = stage ? [...stage.children] : [];
    if (slides.length < 2) return;
    root.dataset.ssReady = "1";

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)");
    let index = 0;
    let stopped = reduce.matches;

    const controls = document.createElement("div");
    controls.className = "ss-controls";
    controls.innerHTML = `
      <button type="button" class="ss-ctl" data-prev aria-label="Previous slide">${window.icon("arrowLeft")}</button>
      <div class="ss-dots">${slides.map((_, n) =>
        `<button type="button" class="ss-dot" data-go="${n}" aria-label="Show slide ${n + 1}"><span class="ss-dot__bar"><i></i></span></button>`).join("")}</div>
      <button type="button" class="ss-ctl" data-next aria-label="Next slide">${window.icon("arrowRight")}</button>
      ${reduce.matches ? "" : `<button type="button" class="ss-ctl ss-ctl--toggle" data-toggle></button>`}`;
    root.appendChild(controls);

    const dots = [...controls.querySelectorAll(".ss-dot")];
    const toggle = controls.querySelector("[data-toggle]");

    function syncPlayState() {
      root.classList.toggle("is-stopped", stopped);
      stage.setAttribute("aria-live", stopped ? "polite" : "off");
      if (toggle) {
        toggle.innerHTML = window.icon(stopped ? "play" : "pause");
        toggle.setAttribute("aria-label", stopped ? "Play slideshow" : "Pause slideshow");
      }
    }

    function show(n) {
      index = (n + slides.length) % slides.length;
      slides.forEach((s, k) => s.classList.toggle("is-active", k === index));
      dots.forEach((d) => d.classList.remove("is-on"));
      void controls.offsetWidth; /* flush styles so the fill animation restarts from 0 */
      dots[index].classList.add("is-on");
      dots.forEach((d, k) => d.setAttribute("aria-current", k === index ? "true" : "false"));
    }

    controls.addEventListener("animationend", (e) => {
      if (e.animationName === "ss-fill" && !reduce.matches) show(index + 1);
    });
    controls.addEventListener("click", (e) => {
      const btn = e.target.closest("button");
      if (!btn) return;
      if (btn.dataset.go != null) show(+btn.dataset.go);
      else if ("prev" in btn.dataset) show(index - 1);
      else if ("next" in btn.dataset) show(index + 1);
      else if ("toggle" in btn.dataset) { stopped = !stopped; syncPlayState(); if (!stopped) show(index); }
    });

    /* swipe on touch, arrow keys when focus is inside the slideshow */
    let x0 = 0, y0 = 0;
    stage.addEventListener("touchstart", (e) => { x0 = e.touches[0].clientX; y0 = e.touches[0].clientY; }, { passive: true });
    stage.addEventListener("touchend", (e) => {
      const dx = e.changedTouches[0].clientX - x0, dy = e.changedTouches[0].clientY - y0;
      if (Math.abs(dx) > 45 && Math.abs(dx) > Math.abs(dy) * 1.5) show(index + (dx < 0 ? 1 : -1));
    }, { passive: true });
    root.addEventListener("keydown", (e) => {
      if (e.key === "ArrowLeft") { show(index - 1); e.preventDefault(); }
      else if (e.key === "ArrowRight") { show(index + 1); e.preventDefault(); }
    });

    syncPlayState();
    show(0);
  }

  function main() {
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

  /* customer stories — a looping row of review cards. They come from window.Reviews, the
     same store the product-page review sections write to, so a review written on any
     product shows up here by itself. Review text is customer-written: always escaped. */
  const esc = window.escHtml;
  const stories = window.Reviews.featured(); // newest reviews first, the earlier ones always kept after them
  if (!stories.length) {
    $("#storiesSection").hidden = true;
  } else {
    const cards = stories.map((r) => {
      const product = r.productId && window.getProduct(r.productId);
      const meta = [
        r.city ? esc(r.city) + (r.verified ? " · Verified buyer" : "") : "",
        product ? `Reviewed <a href="product.html?id=${encodeURIComponent(product.id)}">${esc(product.name.split("—")[0].trim())}</a>` : "",
      ].filter(Boolean).join(" · ");
      const initials = r.name.split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase();
      return `
      <figure class="rv-card">
        ${window.stars(r.rating)}
        <blockquote class="rv-card__quote">“${esc(r.text)}”</blockquote>
        <figcaption class="rv-who">
          <span class="rv-avatar">${esc(initials)}</span>
          <span class="rv-who__txt"><b>${esc(r.name)}</b>${meta ? `<small>${meta}</small>` : ""}</span>
        </figcaption>
      </figure>`;
    }).join("");
    /* The track holds the set twice and slides by exactly one set, so the loop has no seam.
       The copy is hidden from assistive tech and the tab order (aria-hidden + inert) so each
       review is announced and focusable once. One set must be wider than the three-card
       window — the earlier reviews guarantee at least four cards. */
    const track = $("#storyTrack");
    track.innerHTML = cards + cards.replace(/<figure class="rv-card">/g, '<figure class="rv-card" aria-hidden="true" inert>');
    track.style.setProperty("--marquee-dur", `${stories.length * 7}s`); // ~7s of travel per card, so each stays readable
  }

  /* newsletter */
  const form = $("[data-newsletter]");
  if (form) form.addEventListener("submit", (e) => {
    e.preventDefault();
    form.reset();
    window.toast("You’re in — check your inbox for 10% off.");
  });

  window.hydrateIcons(document.querySelector("main"));
  window.initReveal();
  }
})();
