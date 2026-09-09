/* ========================= product detail page ========================= */
(function () {
  "use strict";
  const $ = (s, r = document) => r.querySelector(s);
  const money = window.money;

  const id = new URLSearchParams(location.search).get("id");
  const p = window.getProduct(id);
  const root = $("#pdpRoot");

  if (!p) {
    root.innerHTML = `<div class="empty-state" style="padding:100px 20px">
      ${window.icon("bag")}<h3>Product not found</h3>
      <p>That item may have sold out or moved.</p>
      <a class="btn btn--outline btn--sm" href="shop.html" style="margin-top:16px">Browse the shop</a></div>`;
    document.addEventListener("chrome:ready", () => window.hydrateIcons(root), { once: true });
    return;
  }

  const catLabel = (window.CATEGORIES.find((c) => c.slug === p.cat) || {}).label || "";
  document.title = p.name + " — Parentree Organics";

  const state = {
    color: p.colors && p.colors[0] ? p.colors[0][0] : "",
    size: "",
    qty: 1,
  };

  root.innerHTML = `
    <div class="pdp">
      <div class="pdp__gallery">
        <div class="pdp__main"><img id="pdpImg" src="${p.img}" alt="${p.name}" width="800" height="800" fetchpriority="high"></div>
      </div>
      <div class="pdp__info">
        <span class="pdp__cat">${catLabel}</span>
        <h1 class="pdp__title">${p.name}</h1>
        <div class="rating-line">${window.stars(p.rating)} <span>${p.rating.toFixed(1)} · ${p.reviews} reviews</span></div>

        <div class="pdp__price" style="margin-top:16px">
          <span class="now">${money(p.price)}</span>
          ${p.mrp && p.mrp > p.price ? `<span class="mrp">${money(p.mrp)}</span><span class="off">-${p.discount}%</span>` : ""}
        </div>
        <p style="font-size:.8rem;color:var(--muted)">MRP incl. of all taxes · Free delivery</p>

        <p class="pdp__blurb">${p.blurb}</p>

        ${p.colors && p.colors.length > 1 ? `
        <div class="pdp__opt">
          <h4>Colour: <b data-color-name>${state.color}</b></h4>
          <div class="swatch-row" id="swatchRow">
            ${p.colors.map((c, i) => `<button class="swatch${i === 0 ? " is-active" : ""}" data-color="${c[0]}" title="${c[0]}"><i style="background:${c[1]}"></i></button>`).join("")}
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
  const priceFor = () => p.price * state.qty;
  const refreshPrice = () => {
    $("#addBtn").textContent = `Add to basket · ${money(priceFor())}`;
    $("#buyBarPrice").textContent = money(priceFor());
    $("[data-qty-val]").textContent = state.qty;
  };

  root.addEventListener("click", (e) => {
    const sw = e.target.closest("[data-color]");
    if (sw) {
      state.color = sw.dataset.color;
      $$("#swatchRow .swatch").forEach((b) => b.classList.toggle("is-active", b === sw));
      $("[data-color-name]").textContent = state.color;
    }
    const sz = e.target.closest("[data-size]");
    if (sz) {
      state.size = sz.dataset.size;
      $$("#sizeRow .size-btn").forEach((b) => b.classList.toggle("is-active", b === sz));
      $("[data-size-name]").textContent = state.size;
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

  document.addEventListener("chrome:ready", () => {
    window.hydrateIcons(document.querySelector("main"));
    window.hydrateIcons($("#buyBar"));
    $("#buyBar").hidden = false;
    refreshPrice();
    window.initReveal();
    // reflect wishlist state
    document.dispatchEvent(new CustomEvent("store:change"));
  }, { once: true });
})();
