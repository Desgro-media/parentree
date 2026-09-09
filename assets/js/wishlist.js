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
    items.forEach((p) => {
      const color = p.colors && p.colors[0] ? p.colors[0][0] : "";
      const size = p.sizes && p.sizes.length ? p.sizes[Math.min(1, p.sizes.length - 1)] : "";
      S.addToCart(p.id, { color, size, qty: 1 });
    });
    window.toast(`Added ${items.length} ${items.length === 1 ? "item" : "items"} to your basket`, "Checkout", "cart.html");
  });

  document.addEventListener("chrome:ready", render, { once: true });
  document.addEventListener("store:change", render);
})();
