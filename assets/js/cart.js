/* ============================== cart page ============================== */
(function () {
  "use strict";
  const $ = (s, r = document) => r.querySelector(s);
  const money = window.money;
  const S = window.Store;
  const TH = window.SITE.freeGiftThreshold;

  function render() {
    const root = $("#cartRoot");
    const lede = $("#cartLede");

    if (!S.cart.length) {
      lede.textContent = "Nothing here yet.";
      root.innerHTML = `<div class="empty-state" style="padding:70px 20px">
        ${window.icon("bag")}
        <h3>Your basket is empty</h3>
        <p>Once you add something, it’ll wait for you here — even if you close the tab.</p>
        <a class="btn btn--lg" href="shop.html" style="margin-top:20px">Start shopping</a></div>`;
      window.hydrateIcons(root);
      return;
    }

    const sub = S.cartSubtotal();
    const mrp = S.cartMrpTotal();
    const saved = mrp - sub;
    const left = Math.max(0, TH - sub);
    const pct = Math.min(100, Math.round((sub / TH) * 100));
    const count = S.cartCount();
    lede.textContent = `${count} ${count === 1 ? "item" : "items"} · saved for you on this device`;

    root.innerHTML = `
      <div class="cart-layout">
        <div>
          <div id="cartRows">${S.cart.map(row).join("")}</div>
          <div style="display:flex;justify-content:space-between;align-items:center;padding-top:18px">
            <a class="link-more" href="shop.html">SPRITE_ARROWLEFT Continue shopping</a>
            <button class="chip" id="clearCart">${window.icon("trash")} Clear basket</button>
          </div>
        </div>

        <aside class="summary">
          <h3>Order summary</h3>
          <div class="summary__line"><span>Subtotal (${count} ${count === 1 ? "item" : "items"})</span><span>${money(sub)}</span></div>
          ${saved > 0 ? `<div class="summary__line" style="color:var(--clay);font-weight:600"><span>You save</span><span>−${money(saved)}</span></div>` : ""}
          <div class="summary__line"><span>Delivery</span><span>Free</span></div>

          <div class="summary__note">
            ${window.icon("gift")}
            <span>${left > 0
              ? `Add <b>${money(left)}</b> more and we’ll tuck in a <b>free muslin blanket</b>.`
              : `A <b>free muslin blanket</b> has been added to this order.`}
              <span class="cart-progress__bar" style="display:block;margin-top:8px">
                <span class="cart-progress__fill" style="display:block;width:${pct}%"></span></span>
            </span>
          </div>

          <div class="promo-row">
            <input type="text" id="promoInput" placeholder="Gift or promo code" aria-label="Promo code">
            <button class="btn btn--light btn--sm" id="promoApply">Apply</button>
          </div>
          <p id="promoMsg" style="font-size:.78rem;color:var(--muted);margin:-6px 0 6px"></p>

          <div class="summary__line summary__line--total"><span>Total</span><span id="grandTotal">${money(sub)}</span></div>

          <button class="btn btn--ink btn--block btn--lg" id="checkoutBtn" style="margin-top:8px">
            Proceed to checkout ${window.icon("arrowRight")}</button>

          <div class="pdp__assurances" style="margin-top:16px">
            <div>${window.icon("shield")} Secure checkout · UPI, cards, COD</div>
            <div>${window.icon("refresh")} 7-day easy returns &amp; exchanges</div>
          </div>
        </aside>
      </div>`;

    wire();
    window.hydrateIcons(root);
  }

  function row(l) {
    const p = window.getProduct(l.id);
    if (!p) return "";
    const key = S.lineKey(l.id, l.color, l.size);
    const opt = [l.color, l.size].filter(Boolean).join(" · ");
    return `<article class="cart-page-item" data-key="${key}">
      <a href="product.html?id=${p.id}"><img src="${p.img}" alt="${p.name}" loading="lazy"></a>
      <div>
        <h3><a href="product.html?id=${p.id}">${p.name}</a></h3>
        ${opt ? `<p style="color:var(--muted);font-size:.84rem;margin-top:4px">${opt}</p>` : ""}
        <div class="qty" style="margin-top:12px">
          <button data-dec aria-label="Decrease">${window.icon("minus")}</button>
          <span>${l.qty}</span>
          <button data-inc aria-label="Increase">${window.icon("plus")}</button>
        </div>
        <button class="cart-item__remove" data-rm style="margin-top:10px">Remove</button>
      </div>
      <div style="text-align:right">
        <div class="cart-item__price">${money(p.price * l.qty)}</div>
        ${p.mrp > p.price ? `<div class="card__mrp">${money(p.mrp * l.qty)}</div>` : ""}
      </div>
    </article>`;
  }

  function wire() {
    $("#cartRows").querySelectorAll(".cart-page-item").forEach((r) => {
      const key = r.dataset.key;
      const cur = () => S.cart.find((x) => S.lineKey(x.id, x.color, x.size) === key);
      r.querySelector("[data-inc]").addEventListener("click", () => S.setQty(key, (cur()?.qty || 1) + 1));
      r.querySelector("[data-dec]").addEventListener("click", () => S.setQty(key, (cur()?.qty || 1) - 1));
      r.querySelector("[data-rm]").addEventListener("click", () => S.removeLine(key));
    });
    $("#clearCart").addEventListener("click", () => { if (confirm("Remove all items from your basket?")) S.clearCart(); });

    const promo = $("#promoApply");
    if (promo) promo.addEventListener("click", () => {
      const code = $("#promoInput").value.trim().toUpperCase();
      const msg = $("#promoMsg");
      const codes = { WELCOME10: 0.1, ORGANIC15: 0.15 };
      if (codes[code]) {
        const sub = S.cartSubtotal();
        const total = Math.round(sub * (1 - codes[code]));
        $("#grandTotal").textContent = money(total);
        msg.textContent = `“${code}” applied — ${codes[code] * 100}% off.`;
        msg.style.color = "var(--sage-700)";
      } else {
        msg.textContent = code ? `“${code}” isn’t a valid code.` : "Enter a code to apply.";
        msg.style.color = "var(--muted)";
      }
    });

    $("#checkoutBtn").addEventListener("click", () =>
      window.toast("This is a redesign concept — checkout isn’t wired up.", "Keep browsing", "shop.html"));
  }

  document.addEventListener("chrome:ready", render, { once: true });
  document.addEventListener("store:change", render);
})();
