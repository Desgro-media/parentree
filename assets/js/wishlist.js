/* ============================ wishlist page ============================ */
(function () {
  "use strict";
  const $ = (s) => document.querySelector(s);
  const S = window.Store;

  function render() {
    const items = S.wish.map((id) => window.getProduct(id)).filter(Boolean);
    const root = $("#wishRoot");
    const addAll = $("#addAllBtn");
    $("#wishLede").textContent = items.length
      ? `${items.length} ${items.length === 1 ? "piece" : "pieces"} you’re thinking about`
      : "Nothing saved yet.";

    if (!items.length) {
      addAll.hidden = true;
      root.innerHTML = `<div class="empty-state" style="padding:70px 20px">
        ${window.icon("heart")}
        <h3>No saved items</h3>
        <p>Tap the heart on any product to keep it here for later.</p>
        <a class="btn btn--lg" href="shop.html" style="margin-top:20px">Explore the shop</a></div>`;
      window.hydrateIcons(root);
      return;
    }

    addAll.hidden = false;
    root.innerHTML = `<div class="product-grid product-grid--4">
      ${items.map((p) => window.productCard(p, { reveal: true })).join("")}</div>`;
    window.hydrateIcons(root);
    window.initReveal();
  }

  $("#addAllBtn").addEventListener("click", () => {
    const items = S.wish.map((id) => window.getProduct(id)).filter(Boolean);
    const tally = { added: 0, choose: 0, soldout: 0 };
    items.forEach((p) => { tally[window.addDefault(p)]++; });

    const notes = [];
    if (tally.choose) notes.push(`${tally.choose} need${tally.choose === 1 ? "s" : ""} a size — open ${tally.choose === 1 ? "it" : "them"} to choose`);
    if (tally.soldout) notes.push(`${tally.soldout} sold out`);
    const head = tally.added
      ? `Added ${tally.added} ${tally.added === 1 ? "item" : "items"} to your basket`
      : "Nothing added";
    window.toast(head + (notes.length ? " · " + notes.join(" · ") : ""),
      tally.added ? "Checkout" : "", tally.added ? "cart.html" : "");
  });

  document.addEventListener("chrome:ready", render, { once: true });
  document.addEventListener("store:change", render);
})();
