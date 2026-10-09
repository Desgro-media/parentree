/* ========================= product detail page ========================= */
(function () {
  "use strict";
  const $ = (s, r = document) => r.querySelector(s);
  const money = window.money;

  Promise.resolve(window.Catalog && window.Catalog.ready).then(main);

  function main() {
  const id = new URLSearchParams(location.search).get("id");
  const p = window.getProduct(id);
  const root = $("#pdpRoot");

  if (!p) {
    root.innerHTML = `<div class="empty-state" style="padding:100px 20px">
      ${window.icon("bag")}<h1 style="font-size:clamp(1.12rem,2.1vw,1.4rem)">Product not found</h1>
      <p>That item may have sold out or moved.</p>
      <a class="btn btn--outline btn--sm" href="shop.html" style="margin-top:16px">Browse the shop</a></div>`;
    document.addEventListener("chrome:ready", () => window.hydrateIcons(root), { once: true });
    return;
  }

  const catLabel = (window.CATEGORIES.find((c) => c.slug === p.cat) || {}).label || "";
  document.title = p.name + " — Momira Organic";

  const state = {
    color: window.defaultColor(p),
    size: "",
    qty: 1,
  };

  /* Live products: the chosen colour + size resolve to one Shopify variant,
     which carries its own price and stock. Static demo products have none. */
  function pickedSize() {
    return state.size || (p.sizes && p.sizes.length === 1 ? p.sizes[0] : "");
  }
  function variantNow() {
    return p.variants ? window.Catalog.resolveVariant(p, { color: state.color, size: pickedSize() }) : null;
  }
  function inStock(color, size) {
    if (!p.variants) return true;
    const v = window.Catalog.resolveVariant(p, { color, size });
    return !!(v && v.available);
  }
  function priceHtml() {
    const v = variantNow();
    const now = v ? v.price : p.price, mrp = v ? v.mrp : p.mrp;
    const off = v ? (mrp > now ? Math.round((1 - now / mrp) * 100) : 0) : p.discount;
    return `<span class="now">${!v && p.priceVaries ? "From " : ""}${money(now)}</span>`
      + (mrp && mrp > now ? `<span class="mrp">${money(mrp)}</span><span class="off">-${off}%</span>` : "");
  }

  root.innerHTML = `
    <div class="pdp">
      <div class="pdp__gallery">
        <div class="pdp__main"><img id="pdpImg" src="${p.img}" alt="${p.name}" width="800" height="800" fetchpriority="high"></div>
      </div>
      <div class="pdp__info">
        <span class="pdp__cat">${catLabel}</span>
        <h1 class="pdp__title">${p.name}</h1>
        <div id="pdpRating">${ratingHtml()}</div>

        <div class="pdp__price" id="pdpPrice" style="margin-top:16px">${priceHtml()}</div>
        <p style="font-size:.8rem;color:var(--muted)">MRP incl. of all taxes · Free delivery</p>

        <p class="pdp__blurb">${p.blurb}</p>

        ${p.colors && p.colors.length > 1 ? `
        <div class="pdp__opt">
          <h4>Colour: <b data-color-name>${state.color}</b></h4>
          <div class="swatch-row" id="swatchRow">
            ${p.colors.map((c) => `<button class="swatch${c[0] === state.color ? " is-active" : ""}" data-color="${c[0]}" title="${c[0]}"><i style="background:${c[1]}"></i></button>`).join("")}
          </div>
        </div>` : ""}

        ${p.sizes && p.sizes.length ? `
        <div class="pdp__opt">
          <h4>${p.sizes.length > 1 && /m|y/.test(p.sizes[0]) ? "Size (age)" : "Size"}: <b data-size-name>Select</b></h4>
          <div class="size-row" id="sizeRow">
            ${p.sizes.map((s) => `<button class="size-btn" data-size="${s}">${s}</button>`).join("")}
          </div>
        </div>` : ""}

        <div class="pdp__buy">
          <div class="qty">
            <button data-qty="-1" aria-label="Decrease quantity">${window.icon("minus")}</button>
            <span data-qty-val>1</span>
            <button data-qty="1" aria-label="Increase quantity">${window.icon("plus")}</button>
          </div>
          <button class="btn btn--ink btn--lg" id="addBtn">Add to basket · ${money(p.price)}</button>
        </div>
        <button class="btn btn--outline btn--block" id="wishBtnLg" data-wish-btn="${p.id}">
          ${window.icon("heart")} Save for later
        </button>

        <div class="pdp__assurances">
          <div>${window.icon("shield")} GOTS-certified organic cotton, coloured with plant-based dyes</div>
          <div>${window.icon("truck")} Free delivery across India · dispatched in 24–48 hrs</div>
          <div>${window.icon("refresh")} Easy 7-day returns and size exchanges</div>
          <div>${window.icon("gift")} Free muslin blanket on orders over ₹2,600</div>
        </div>

        <div class="pdp__accordion">
          ${accordion("Product details", `<ul>${(p.features || []).map((f) => `<li>${f}</li>`).join("")}</ul>`, true)}
          ${accordion("Fabric &amp; care", `<p>Machine wash cold on a gentle cycle with mild detergent. Do not bleach. Tumble dry low or line dry in shade. Warm iron if needed — though crinkle muslin rarely needs it. Colours are plant-derived and may soften gently over the first few washes; this is normal.</p>`)}
          ${accordion("Shipping &amp; returns", `<p>Free delivery everywhere in India, dispatched within 24–48 hours. Returns and size exchanges accepted within 7 days of delivery for unworn items with tags. Gift sets can be exchanged for a different size within 15 days.</p>`)}
        </div>
      </div>
    </div>`;

  /* catalogue rating + reviews customers have written (window.Reviews); links to the section below */
  function ratingHtml() {
    const rs = window.Reviews.stats(p);
    return rs.count
      ? `<a class="rating-line" href="#reviews">${window.stars(rs.average)} <span>${rs.average.toFixed(1)} · ${rs.count} ${rs.count === 1 ? "review" : "reviews"}</span></a>`
      : "";
  }

  function accordion(title, body, open) {
    return `<div class="acc-item${open ? " open" : ""}">
      <button class="acc-item__head">${title} ${window.icon("plus")}</button>
      <div class="acc-item__body">${body}</div>
    </div>`;
  }

  /* crumb */
  $("#pdpCrumb").insertAdjacentHTML("beforeend",
    ` SPRITE_CHEVRIGHT <a href="shop.html?category=${p.cat}">${catLabel}</a> SPRITE_CHEVRIGHT <span>${p.name}</span>`);

  /* ---- interactions ---- */
  const unitPrice = () => { const v = variantNow(); return v ? v.price : p.price; };
  const priceFor = () => unitPrice() * state.qty;

  /* one place that brings price, sold-out marks and the buy buttons in line
     with the current colour / size / quantity */
  const refreshPrice = () => {
    const v = variantNow();
    const out = p.soldOut || (v && !v.available);
    $("#pdpPrice").innerHTML = priceHtml();
    $("#addBtn").textContent = out ? "Sold out" : `Add to basket · ${money(priceFor())}`;
    $("#addBtn").disabled = !!out;
    $("#buyBarPrice").textContent = money(priceFor());
    $("#buyBarAdd").textContent = out ? "Sold out" : "Add to basket";
    $("#buyBarAdd").disabled = !!out;
    $("[data-qty-val]").textContent = state.qty;
  };

  function refreshAvailability() {
    if (!p.variants) return;
    $$("#swatchRow .swatch").forEach((b) => {
      b.classList.toggle("is-soldout", !p.variants.some((v) => v.color === b.dataset.color && v.available));
    });
    $$("#sizeRow .size-btn").forEach((b) => {
      const ok = inStock(state.color, b.dataset.size);
      b.classList.toggle("is-soldout", !ok);
      b.title = ok ? "" : "Sold out in this colour";
    });
    /* a size picked earlier may not exist in the newly chosen colour */
    if (state.size && !inStock(state.color, state.size)) {
      state.size = "";
      $$("#sizeRow .size-btn").forEach((b) => b.classList.remove("is-active"));
      const nm = $("[data-size-name]"); if (nm) nm.textContent = "Select";
    }
  }

  root.addEventListener("click", (e) => {
    const sw = e.target.closest("[data-color]");
    if (sw) {
      state.color = sw.dataset.color;
      $$("#swatchRow .swatch").forEach((b) => b.classList.toggle("is-active", b === sw));
      $("[data-color-name]").textContent = state.color;
      refreshAvailability(); refreshPrice();
    }
    const sz = e.target.closest("[data-size]");
    if (sz && !sz.classList.contains("is-soldout")) {
      state.size = sz.dataset.size;
      $$("#sizeRow .size-btn").forEach((b) => b.classList.toggle("is-active", b === sz));
      $("[data-size-name]").textContent = state.size;
      refreshPrice();
    }
    const q = e.target.closest("[data-qty]");
    if (q) { state.qty = Math.max(1, state.qty + Number(q.dataset.qty)); refreshPrice(); }
    const acc = e.target.closest(".acc-item__head");
    if (acc) acc.parentElement.classList.toggle("open");
  });

  function $$(s) { return [...document.querySelectorAll(s)]; }

  function addToCart() {
    if (p.sizes && p.sizes.length > 1 && !state.size) {
      window.toast("Please choose a size first");
      $("#sizeRow").animate(
        [{ transform: "translateX(-4px)" }, { transform: "translateX(4px)" }, { transform: "translateX(0)" }],
        { duration: 240, iterations: 2 });
      return;
    }
    const size = state.size || (p.sizes && p.sizes[0]) || "";
    if (p.variants && !inStock(state.color, size)) {
      window.toast("That option is sold out — try another size or colour.", "", "", "error");
      return;
    }
    window.Store.addToCart(p.id, { color: state.color, size, qty: state.qty });
    window.toast(`Added to basket · ${state.qty} × ${p.name.split("—")[0].trim()}`, "Checkout", "cart.html");
    const cd = $("#cartDrawer");
    if (cd) { $("[data-scrim]").classList.add("open"); cd.classList.add("open"); document.body.classList.add("no-scroll"); }
  }
  $("#addBtn").addEventListener("click", addToCart);
  $("#buyBarAdd").addEventListener("click", addToCart);

  /* related */
  const related = window.byCategory(p.cat).filter((x) => x.id !== p.id).slice(0, 4);
  const relFill = related.length < 4
    ? [...related, ...window.PRODUCTS.filter((x) => x.id !== p.id && x.cat !== p.cat)].slice(0, 4)
    : related;
  $("#relatedGrid").innerHTML = relFill.map((x) => window.productCard(x, { reveal: true })).join("");
  $("#relatedWrap").hidden = false;

  /* ---- customer reviews ----
     Everything comes from, and goes to, window.Reviews — the home page's customer-stories
     slideshow reads the same store, so a review posted here shows up there on its own.
     Review text is customer-written, so every piece of it goes through escHtml. */
  const esc = window.escHtml;
  const REVIEWS_SHOWN = 5;
  let showAllReviews = false;
  const reviewsEl = $("#reviews");

  function reviewCard(r) {
    const when = r.ts ? new Date(r.ts) : null;
    const initials = r.name.split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase();
    return `<article class="rv-card">
      <div class="rv-card__head">${window.stars(r.rating, 13)}${when
        ? `<time datetime="${when.toISOString()}">${when.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</time>` : ""}</div>
      <p class="rv-card__quote">${esc(r.text)}</p>
      <div class="rv-who"><span class="rv-avatar">${esc(initials)}</span><span class="rv-who__txt"><b>${esc(r.name)}</b>${r.city
        ? `<small>${esc(r.city)}${r.verified ? " · Verified buyer" : ""}</small>` : ""}</span></div>
    </article>`;
  }

  function renderReviews() {
    const list = window.Reviews.forProduct(p.id);          // written about THIS product, newest first
    const earlier = window.Reviews.earlier();              // the original customer reviews — always shown, so the section is never blank
    const rs = window.Reviews.stats(p);
    const shown = showAllReviews ? list : list.slice(0, REVIEWS_SHOWN);
    const MAX = window.Reviews.MAX_TEXT;
    reviewsEl.innerHTML = `
      <div class="section-head">
        <div><span class="eyebrow">Customer reviews</span><h2 class="section-title" id="reviewsTitle">What parents say</h2></div>
        <button class="btn btn--outline btn--sm" id="writeReviewBtn" type="button" aria-expanded="false" aria-controls="reviewForm">Write a review</button>
      </div>
      <div class="reviews">
        <div class="reviews__summary">
          ${rs.count
            ? `<div class="reviews__avg">${rs.average.toFixed(1)}</div>${window.stars(rs.average, 18)}<p>${rs.count} ${rs.count === 1 ? "rating" : "ratings"}</p>`
            : `<p>No ratings for this product yet.<br>Be the first to share how it feels.</p>`}
        </div>
        <div class="reviews__main">
          <form class="review-form" id="reviewForm" hidden novalidate>
            <fieldset class="star-field">
              <legend>Your rating</legend>
              <div class="star-input">
                ${[5, 4, 3, 2, 1].map((n) => `<input type="radio" name="rating" id="rate${n}" value="${n}"><label for="rate${n}"><span class="sr-only">${n} star${n > 1 ? "s" : ""}</span>${window.icon("star")}</label>`).join("")}
              </div>
            </fieldset>
            <label class="field"><span>Your review</span>
              <textarea name="text" rows="4" maxlength="${MAX}" required placeholder="How does it feel, wash and fit?"></textarea></label>
            <p class="review-form__hint"><span id="reviewCount">0</span>/${MAX} · Posting as <b id="reviewAs"></b></p>
            <p class="auth-error" id="reviewError" role="alert" hidden></p>
            <div class="review-form__actions">
              <button class="btn" type="submit">Post review</button>
              <button class="btn btn--light" type="button" id="cancelReview">Cancel</button>
            </div>
          </form>
          <div class="reviews__list" id="reviewsList">${shown.length ? shown.map(reviewCard).join("")
            : `<p class="reviews__empty">${rs.count ? "No written reviews of this product yet — yours could be the first." : ""}</p>`}</div>
          ${list.length > REVIEWS_SHOWN && !showAllReviews
            ? `<button class="btn btn--light btn--sm" id="moreReviews" type="button">Show all ${list.length} reviews</button>` : ""}
          ${earlier.length ? `
          <h3 class="reviews__sub">Earlier reviews from our customers</h3>
          <p class="reviews__note">Shared by customers about Momira overall — new reviews of this product are added above.</p>
          <div class="reviews__list" id="earlierList">${earlier.map(reviewCard).join("")}</div>` : ""}
        </div>
      </div>`;
    reviewsEl.hidden = false;
  }

  function openReviewForm() {
    if (window.Reviews.hasReviewed(p.id)) { window.toast("You’ve already reviewed this product."); return; }
    const f = $("#reviewForm");
    f.hidden = false;
    $("#writeReviewBtn").setAttribute("aria-expanded", "true");
    $("#reviewAs").textContent = window.Reviews.publicName(window.Auth.currentUser().name);
    f.scrollIntoView({ behavior: "smooth", block: "center" });
    setTimeout(() => f.querySelector("textarea").focus({ preventScroll: true }), 250);
  }

  reviewsEl.addEventListener("click", (e) => {
    if (e.target.closest("#writeReviewBtn")) window.Auth.requireLogin(openReviewForm, "review");
    else if (e.target.closest("#cancelReview")) { $("#reviewForm").hidden = true; $("#reviewForm").reset(); $("#reviewCount").textContent = "0"; $("#writeReviewBtn").setAttribute("aria-expanded", "false"); }
    else if (e.target.closest("#moreReviews")) { showAllReviews = true; renderReviews(); }
  });
  reviewsEl.addEventListener("input", (e) => {
    if (e.target.matches("#reviewForm textarea")) $("#reviewCount").textContent = e.target.value.length;
  });
  reviewsEl.addEventListener("submit", (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    const res = window.Reviews.submit({ productId: p.id, rating: fd.get("rating"), text: fd.get("text") });
    if (!res.ok) { const err = $("#reviewError"); err.textContent = res.error; err.hidden = false; return; }
    window.toast("Thanks — your review is live.");
  });
  /* one handler for every way a review can arrive: re-draw the section and the rating line */
  document.addEventListener("reviews:change", () => { renderReviews(); $("#pdpRating").innerHTML = ratingHtml(); });
  renderReviews();

  document.addEventListener("chrome:ready", () => {
    window.hydrateIcons(document.querySelector("main"));
    window.hydrateIcons($("#buyBar"));
    $("#buyBar").hidden = false;
    refreshAvailability();
    refreshPrice();
    window.initReveal();
    // reflect wishlist state
    document.dispatchEvent(new CustomEvent("store:change"));
  }, { once: true });
  }
})();
