/* ========================= product detail page ========================= */
(function () {
  "use strict";
  const $ = (s, r = document) => r.querySelector(s);
  const money = window.money;
  const esc = window.escHtml;

  /* delivery estimate: dispatched the next day, at the door five days after ordering */
  const DISPATCH_DAYS = 1, DELIVERY_DAYS = 5;
  /* "frequently bought together" shows the product itself plus up to this many others */
  const FBT_MAX = 3;

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
  $("#babyBenefits").hidden = false;

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

  /* ---- size chart: clothing only. Products with age sizes get it; so does one with no size
     option yet. Swaddles/essentials sized in cm or "one size" don't. ---- */
  const AGE_SIZE = /\d\s*[-–]\s*\d+\s*(m|mo|months?|y|yrs?|years?)\b/i;
  function wantsSizeChart() {
    if (!p.sizes || !p.sizes.length || p.sizeIsNote) return true;
    if (p.cat === "essentials" || p.cat === "swaddles") return false;
    return p.sizes.some((s) => AGE_SIZE.test(s));
  }
  const chartBtn = wantsSizeChart()
    ? `<button type="button" class="size-guide" data-size-chart>${window.icon("ruler")} Size chart</button>` : "";

  function deliveryHtml() {
    const day = (n) => {
      const d = new Date(); d.setDate(d.getDate() + n);
      return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
    };
    const ship = day(DISPATCH_DAYS), arrive = day(DELIVERY_DAYS);
    return `<section class="dlv" aria-label="Estimated delivery">
      <p class="dlv__title">Estimated Delivery Date: <b>${ship} to ${arrive}</b></p>
      <ol class="dlv__track">
        <li>${window.icon("cart")}<b>Order Confirmed</b><small>${day(0)}</small></li>
        <li>${window.icon("truck")}<b>Shipped</b><small>${ship}</small></li>
        <li>${window.icon("pin")}<b>At Your Doorstep</b><small>${arrive}</small></li>
      </ol>
      <p class="dlv__note">Free delivery across India · free muslin blanket on orders over ${money(window.SITE.freeGiftThreshold)}</p>
    </section>`;
  }

  /* ---- frequently bought together ----
     The page's own product + a few others. While the live store is too small to pair anything,
     the demo catalogue fills the gaps as "Coming soon" previews — shown but never buyable, because
     a basket line the live catalogue doesn't know about is dropped on the next page load. */
  const ACCESSORY = ["essentials", "swaddles"];
  const fbt = (function () {
    const rank = (x) => (x.soldOut ? 8 : 0) + (x.cat === p.cat ? 4 : 0)
      + (!ACCESSORY.includes(p.cat) && !ACCESSORY.includes(x.cat) ? 2 : 0);
    const pick = (list) => list.filter((x) => x.id !== p.id).sort((a, b) => rank(a) - rank(b));
    const items = [{ p, main: true }]
      .concat(pick(window.PRODUCTS).slice(0, FBT_MAX).map((x) => ({ p: x })));
    if (items.length < FBT_MAX + 1 && window.Catalog && window.Catalog.isLive() && window.DEMO_PRODUCTS) {
      items.push(...pick(window.DEMO_PRODUCTS).slice(0, FBT_MAX + 1 - items.length).map((x) => ({ p: x, preview: true })));
    }
    items.forEach((it) => {
      const sizes = it.p.sizes || [];
      it.color = it.main ? "" : window.defaultColor(it.p);
      it.size = !it.main && sizes.length === 1 ? sizes[0] : "";
      it.checked = false;
    });
    return items.length > 1 ? items : [];
  })();

  const colorOf = (it) => (it.main ? state.color : it.color);
  const sizeOf = (it) => (it.main ? pickedSize() : it.size);
  function stock(pr, color, size) {
    if (!pr.variants) return !pr.soldOut;
    const v = window.Catalog.resolveVariant(pr, { color, size });
    return v ? v.available : !pr.soldOut;
  }
  /* price / mrp / availability of one row at its current colour + size */
  function unit(it) {
    const pr = it.p;
    const v = pr.variants ? window.Catalog.resolveVariant(pr, { color: colorOf(it), size: sizeOf(it) }) : null;
    return { price: v ? v.price : pr.price, mrp: v ? v.mrp : pr.mrp, ok: !it.preview && (v ? v.available : !pr.soldOut) };
  }
  const miniPrice = (u) => (u.mrp > u.price ? `<s>${money(u.mrp)}</s>` : "") + `<b>${money(u.price)}</b>`;

  function fbtRow(it, i) {
    const pr = it.p, sizes = pr.sizes || [], u = unit(it);
    const name = it.preview ? `<span class="fbt__name">${esc(pr.name)}</span>`
      : it.main ? `<span class="fbt__name">${esc(pr.name)}</span>`
      : `<a class="fbt__name" href="product.html?id=${encodeURIComponent(pr.id)}">${esc(pr.name)}</a>`;
    const select = sizes.length > 1 && !it.preview ? `
      <select class="fbt__size" data-fbt-size aria-label="Size for ${esc(pr.name)}">
        <option value="">Select size</option>
        ${sizes.map((s) => `<option value="${esc(s)}"${stock(pr, colorOf(it), s) ? "" : " disabled"}>${esc(window.sizeLabel(s))}</option>`).join("")}
      </select>` : "";
    return `<li class="fbt__item" data-i="${i}">
      <label class="fbt__check"><input type="checkbox" data-fbt-check${u.ok ? "" : " disabled"}><span aria-hidden="true"></span><span class="sr-only">Include ${esc(pr.name)}</span></label>
      <img src="${pr.img}" alt="" width="64" height="64" loading="lazy">
      <div class="fbt__body">${name}${select}<small class="fbt__tag"${it.preview || !u.ok ? "" : " hidden"}>${it.preview ? "Coming soon" : "Sold out"}</small></div>
      <div class="fbt__price" data-fbt-price>${miniPrice(u)}</div>
    </li>`;
  }

  function fbtHtml() {
    if (!fbt.length) return "";
    return `<section class="fbt" id="fbt" aria-labelledby="fbtTitle">
      <h3 class="fbt__title" id="fbtTitle">Frequently bought together</h3>
      <ul class="fbt__card">${fbtRow(fbt[0], 0)}</ul>
      <span class="fbt__plus" aria-hidden="true">${window.icon("plus")}</span>
      <ul class="fbt__card">${fbt.slice(1).map((it, i) => fbtRow(it, i + 1)).join("")}</ul>
      <div class="fbt__total"><span>Total</span><b id="fbtTotal">${money(0)}</b></div>
      <p class="fbt__hint">Selected items will be added to cart.</p>
      <button class="btn btn--ink btn--block" type="button" id="fbtAdd" disabled>Add selected to cart</button>
    </section>`;
  }

  const descBody = p.features && p.features.length
    ? `<ul>${p.features.map((f) => `<li>${f}</li>`).join("")}</ul>`
    : `<p>Made from GOTS-certified organic cotton and coloured with plant-based dyes — gentle on little ones.</p>`;

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
          <h4>Size: <b data-size-name>Select</b>${chartBtn}</h4>
          <div class="size-row" id="sizeRow">
            ${p.sizes.map((s) => `<button class="size-btn" data-size="${esc(s)}">${esc(window.sizeLabel(s))}</button>`).join("")}
          </div>
        </div>` : (chartBtn ? `<div class="pdp__opt">${chartBtn}</div>` : "")}

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

        ${deliveryHtml()}

        <ul class="pdp__badges">
          <li>${window.icon("cotton")}<span>Organic Cotton</span></li>
          <li>${window.icon("shield")}<span>Skin Safe</span></li>
          <li>${window.icon("refresh")}<span>7-Days Easy Return</span></li>
        </ul>

        <div class="pdp__accordion">
          ${accordion("Product Description", descBody, true)}
          ${accordion("Fabric type", `<p>GOTS-certified organic cotton, coloured with plant-based dyes. The fabric is super-soft and breathable, so it stays gentle on sensitive skin and comfortable all day.</p>`)}
          ${accordion("Cleaning &amp; Caution", `<p>Machine wash cold on a gentle cycle with mild detergent. Do not bleach. Tumble dry low or line dry in shade. Warm iron if needed — though crinkle muslin rarely needs it. Colours are plant-derived and may soften gently over the first few washes; this is normal.</p>`)}
          ${accordion("Return &amp; Exchange", `<p>Free delivery everywhere in India, dispatched within 24–48 hours. Returns and size exchanges accepted within 7 days of delivery for unworn items with tags. Gift sets can be exchanged for a different size within 15 days.</p>`)}
        </div>

        ${fbtHtml()}
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
    syncFbtMain();
  };

  /* the page's size picker and the main row of "frequently bought together" are one choice */
  function setSize(size) {
    state.size = size;
    $$("#sizeRow .size-btn").forEach((b) => b.classList.toggle("is-active", b.dataset.size === size));
    const nm = $("[data-size-name]"); if (nm) nm.textContent = size ? window.sizeLabel(size) : "Select";
    refreshPrice();
  }

  function refreshAvailability() {
    /* a product that's sold out entirely says so on the buy button; striking through every
       size as well would only make the picker unusable */
    if (!p.variants || p.soldOut) return;
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
    if (sz && !sz.classList.contains("is-soldout")) setSize(sz.dataset.size);
    const chart = e.target.closest("[data-size-chart]");
    if (chart) window.SizeChart.open(chart);
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
    openCartDrawer();
  }
  function openCartDrawer() {
    const cd = $("#cartDrawer");
    if (cd) { $("[data-scrim]").classList.add("open"); cd.classList.add("open"); document.body.classList.add("no-scroll"); }
  }
  $("#addBtn").addEventListener("click", addToCart);
  $("#buyBarAdd").addEventListener("click", addToCart);

  /* ---- frequently bought together: ticking, sizing, total, add ---- */
  const fbtEl = $("#fbt");
  const fbtLi = (i) => $(`.fbt__item[data-i="${i}"]`, fbtEl);

  function updateFbtTotal() {
    const picked = fbt.filter((it) => it.checked);
    $("#fbtTotal").textContent = money(picked.reduce((s, it) => s + unit(it).price, 0));
    $("#fbtAdd").disabled = !picked.length;
  }

  function updateFbtRow(i) {
    const it = fbt[i], li = fbtLi(i), u = unit(it);
    const box = li.querySelector("[data-fbt-check]");
    box.disabled = !u.ok;
    if (!u.ok) { box.checked = false; it.checked = false; }
    li.querySelector("[data-fbt-price]").innerHTML = miniPrice(u);
    const tag = li.querySelector(".fbt__tag");
    tag.hidden = u.ok;
    const sel = li.querySelector("[data-fbt-size]");
    if (sel) {
      [...sel.options].forEach((o) => { if (o.value) o.disabled = !stock(it.p, colorOf(it), o.value); });
      sel.value = sizeOf(it);
    }
  }

  /* main row follows the page's colour / size choice */
  function syncFbtMain() {
    if (!fbtEl) return;
    updateFbtRow(0);
    updateFbtTotal();
  }

  if (fbtEl) {
    fbtEl.addEventListener("change", (e) => {
      const li = e.target.closest(".fbt__item"); if (!li) return;
      const i = Number(li.dataset.i), it = fbt[i];
      if (e.target.matches("[data-fbt-check]")) it.checked = e.target.checked;
      else if (e.target.matches("[data-fbt-size]")) {
        if (it.main) { setSize(e.target.value); return; } // refreshPrice re-syncs this row
        it.size = e.target.value;
        updateFbtRow(i);
      }
      updateFbtTotal();
    });

    $("#fbtAdd").addEventListener("click", () => {
      const picked = fbt.filter((it) => it.checked);
      for (const it of picked) {
        const i = fbt.indexOf(it), sizes = it.p.sizes || [];
        if (sizes.length > 1 && !sizeOf(it)) {
          window.toast(`Please choose a size for ${it.p.name.split("—")[0].trim()}`);
          const sel = fbtLi(i).querySelector("[data-fbt-size]");
          if (sel) sel.focus();
          return;
        }
      }
      picked.forEach((it) => {
        window.Store.addToCart(it.p.id, { color: colorOf(it), size: sizeOf(it) || (it.p.sizes && it.p.sizes[0]) || "", qty: 1 });
        it.checked = false;
        fbtEl.querySelectorAll("[data-fbt-check]").forEach((b) => { b.checked = false; });
      });
      updateFbtTotal();
      window.toast(`Added ${picked.length} ${picked.length === 1 ? "item" : "items"} to your basket`, "Checkout", "cart.html");
      openCartDrawer();
    });
  }

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
