/* ==========================================================================
   Parentree Organics — shared runtime
   Chrome injection · cart + wishlist state · UI behaviour · shared renderers
   ========================================================================== */
(function () {
  "use strict";

  /* ----------------------------------------------------------------- icons */
  const I = {
    // line icons (header / ui) — 24x24, stroke
    search:  'M11 4a7 7 0 1 0 0 14 7 7 0 0 0 0-14ZM20 20l-4-4',
    heart:   'M12 20.6 3.9 12.5a5 5 0 0 1 0-7.1 5 5 0 0 1 7.1 0l1 1 1-1a5 5 0 0 1 7.1 0 5 5 0 0 1 0 7.1L12 20.6Z',
    bag:     'M6 8h12l1 12H5L6 8Zm3 0V6a3 3 0 0 1 6 0v2',
    user:    'M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8ZM5 20c1-3.5 4-5 7-5s6 1.5 7 5',
    menu:    'M4 7h16M4 12h16M4 17h16',
    close:   'M6 6l12 12M18 6 6 18',
    chevDown:'M6 9l6 6 6-6',
    chevRight:'M9 6l6 6-6 6',
    arrowRight:'M5 12h14M13 6l6 6-6 6',
    arrowLeft:'M19 12H5M11 6l-6 6 6 6',
    plus:    'M12 5v14M5 12h14',
    minus:   'M5 12h14',
    check:   'M5 13l4 4L19 7',
    truck:   'M3 7h11v10H3zM14 10h4l3 3v4h-7M7.5 17.5a2 2 0 1 0 0 .01M17.5 17.5a2 2 0 1 0 0 .01',
    leaf:    'M5 21c0-9 6-15 15-15 0 9-6 15-15 15Zm3-3c3-6 7-8 9-9',
    cloud:   'M7 18h10a3.5 3.5 0 0 0 .3-7A5.5 5.5 0 0 0 6.5 9.6 3.7 3.7 0 0 0 7 18Z',
    sprout:  'M12 20v-8M12 12C12 8 9 6 5 6c0 4 3 6 7 6Zm0 0c0-4 3-6 7-6 0 4-3 6-7 6Z',
    shield:  'M12 3l7 3v6c0 4.5-3 7.5-7 9-4-1.5-7-4.5-7-9V6l7-3Z',
    sparkle: 'M12 4l1.6 4.4L18 10l-4.4 1.6L12 16l-1.6-4.4L6 10l4.4-1.6L12 4Z',
    thermo:  'M14 14V5a2 2 0 1 0-4 0v9a4 4 0 1 0 4 0Z',
    droplet: 'M12 3s6 6.4 6 10.5A6 6 0 0 1 6 13.5C6 9.4 12 3 12 3Z',
    trash:   'M4 7h16M9 7V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2M6 7l1 13h10l1-13',
    star:    'M12 3.5l2.6 5.3 5.9.9-4.3 4.1 1 5.8-5.2-2.7-5.2 2.7 1-5.8L4 9.7l5.9-.9L12 3.5Z',
    filter:  'M4 6h16M7 12h10M10 18h4',
    tag:     'M4 13 11 6l9 0 0 9-7 7-9-9Zm11-3h.01',
    gift:    'M4 11h16v9H4zM4 7h16v4H4zM12 7v13M12 7S9 3 7 4.5 8 7 12 7Zm0 0s3-4 5-2.5S16 7 12 7Z',
    clock:   'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18ZM12 7v5l3 2',
    phone:   'M6 3h3l2 5-2 1a12 12 0 0 0 6 6l1-2 5 2v3a2 2 0 0 1-2 2A17 17 0 0 1 4 5 2 2 0 0 1 6 3Z',
    mail:    'M4 6h16v12H4zM4 7l8 6 8-6',
    pin:     'M12 21s7-6 7-11a7 7 0 1 0-14 0c0 5 7 11 7 11Zm0-8.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5Z',
    instagram:'M4 8a4 4 0 0 1 4-4h8a4 4 0 0 1 4 4v8a4 4 0 0 1-4 4H8a4 4 0 0 1-4-4V8Zm8 2.5a3.5 3.5 0 1 0 0 7 3.5 3.5 0 0 0 0-7ZM17 6.5h.01',
    whatsapp:'M12 4a8 8 0 0 0-6.9 12l-1 3.6 3.7-1A8 8 0 1 0 12 4Zm3.4 10.9c-.2.5-1 1-1.5 1-.4 0-.9.2-3-.9s-3.3-3.4-3.5-3.6-1-1.3-1-2.5.6-1.8.9-2 .5-.3.7-.3h.5c.2 0 .4 0 .6.5l.8 1.9c0 .2.1.4 0 .5l-.4.6c-.2.2-.3.4-.1.7s.7 1.2 1.5 1.9c1 .9 1.8 1.1 2 1.2s.4 0 .5-.1l.7-.8c.2-.3.4-.2.6-.1l1.8.9c.3.1.4.2.5.3s0 .6-.1 1Z',
    play:    'M8 5v14l11-7L8 5Z',
    ribbon:  'M12 15a5 5 0 1 0 0-10 5 5 0 0 0 0 10Zm-3 .8L7 22l5-2 5 2-2-6.2',
    refresh: 'M4 12a8 8 0 0 1 13.7-5.7L20 8M20 4v4h-4M20 12a8 8 0 0 1-13.7 5.7L4 16m0 4v-4h4',
    // filled mobile-nav icons — 24x24, bespoke
    nHome:   'M4 11.2 12 4l8 7.2V20a1 1 0 0 1-1 1h-4v-5a3 3 0 0 0-6 0v5H5a1 1 0 0 1-1-1v-8.8Z',
    nShop:   'M5 8h14l1.2 11.1a1.5 1.5 0 0 1-1.5 1.7H5.3a1.5 1.5 0 0 1-1.5-1.7L5 8Zm3.2 0a3.8 3.8 0 0 1 7.6 0',
    nHeart:  'M12 20.3 4.3 12.6a4.8 4.8 0 0 1 0-6.8 4.8 4.8 0 0 1 6.8 0l.9.9.9-.9a4.8 4.8 0 0 1 6.8 0 4.8 4.8 0 0 1 0 6.8L12 20.3Z',
    nGrid:   'M4 4h7v7H4V4Zm9 0h7v7h-7V4ZM4 13h7v7H4v-7Zm9 0h7v7h-7v-7Z',
    nUser:   'M12 12.5a4.2 4.2 0 1 0 0-8.4 4.2 4.2 0 0 0 0 8.4ZM4.5 20a7.5 7.5 0 0 1 15 0 1 1 0 0 1-1 1h-13a1 1 0 0 1-1-1Z',
  };
  const FILLED = new Set(["nHome","nShop","nHeart","nGrid","nUser","star","play","whatsapp","heart"]);

  function icon(name, cls) {
    const d = I[name] || "";
    const filled = FILLED.has(name);
    return `<svg viewBox="0 0 24 24" width="1em" height="1em" ${cls ? `class="${cls}"` : ""} aria-hidden="true" `
      + `style="flex:none" fill="${filled ? "currentColor" : "none"}" stroke="${filled ? "none" : "currentColor"}" `
      + `stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="${d}"/></svg>`;
  }
  window.icon = icon;

  /* Replace SPRITE_NAME tokens in markup with inline svg. Case-insensitive,
     matches icon keys (SPRITE_ARROWRIGHT -> arrowRight). Safe to run repeatedly. */
  const ICON_KEYS = {};
  Object.keys(I).forEach((k) => { ICON_KEYS[k.toLowerCase()] = k; });
  function hydrateIcons(root) {
    root = root || document.body;
    const rx = /SPRITE_([A-Za-z]+)/;
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
      acceptNode: (n) => rx.test(n.nodeValue) ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT,
    });
    const nodes = [];
    while (walker.nextNode()) nodes.push(walker.currentNode);
    nodes.forEach((node) => {
      const holder = document.createElement("span");
      holder.innerHTML = node.nodeValue.replace(/SPRITE_([A-Za-z]+)/g, (_, k) => {
        const key = ICON_KEYS[k.toLowerCase()];
        return key ? icon(key) : "";
      });
      node.replaceWith(...holder.childNodes);
    });
  }
  window.hydrateIcons = hydrateIcons;

  /* --------------------------------------------------------------- helpers */
  const $  = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const money = (n) => "₹" + Number(n).toLocaleString("en-IN");
  window.money = money;

  function stars(rating, size) {
    const full = Math.round(rating);
    let out = `<span class="stars"${size ? ` style="--s:${size}px"` : ""}>`;
    for (let i = 1; i <= 5; i++) out += icon("star", i <= full ? "" : "empty");
    return out + "</span>";
  }
  window.stars = stars;

  /* ----------------------------------------------------------------- store */
  const KEY_CART = "ptree_cart_v1";
  const KEY_WISH = "ptree_wish_v1";
  const read = (k) => { try { return JSON.parse(localStorage.getItem(k)) || []; } catch { return []; } };
  const write = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} };

  const Store = {
    cart: read(KEY_CART),
    wish: read(KEY_WISH),
    _emit() {
      write(KEY_CART, this.cart); write(KEY_WISH, this.wish);
      document.dispatchEvent(new CustomEvent("store:change"));
    },
    cartCount() { return this.cart.reduce((n, l) => n + l.qty, 0); },
    cartSubtotal() {
      return this.cart.reduce((s, l) => {
        const p = window.getProduct(l.id); return s + (p ? p.price * l.qty : 0);
      }, 0);
    },
    cartMrpTotal() {
      return this.cart.reduce((s, l) => {
        const p = window.getProduct(l.id); return s + (p ? (p.mrp || p.price) * l.qty : 0);
      }, 0);
    },
    lineKey(id, color, size) { return [id, color || "", size || ""].join("::"); },
    addToCart(id, opts = {}) {
      const { color = "", size = "", qty = 1 } = opts;
      const key = this.lineKey(id, color, size);
      const found = this.cart.find((l) => this.lineKey(l.id, l.color, l.size) === key);
      if (found) found.qty += qty;
      else this.cart.push({ id, color, size, qty });
      this._emit();
    },
    setQty(key, qty) {
      const l = this.cart.find((x) => this.lineKey(x.id, x.color, x.size) === key);
      if (!l) return;
      l.qty = Math.max(1, qty);
      this._emit();
    },
    removeLine(key) {
      this.cart = this.cart.filter((x) => this.lineKey(x.id, x.color, x.size) !== key);
      this._emit();
    },
    clearCart() { this.cart = []; this._emit(); },
    inWish(id) { return this.wish.includes(id); },
    toggleWish(id) {
      this.inWish(id) ? (this.wish = this.wish.filter((x) => x !== id)) : this.wish.push(id);
      this._emit();
      return this.inWish(id);
    },
  };
  window.Store = Store;

  /* ------------------------------------------------------------------ toast */
  let toastWrap;
  function toast(msg, actionLabel, actionHref) {
    if (!toastWrap) {
      toastWrap = document.createElement("div");
      toastWrap.className = "toast-wrap";
      document.body.appendChild(toastWrap);
    }
    const el = document.createElement("div");
    el.className = "toast";
    el.innerHTML = icon("check") + `<span>${msg}</span>`
      + (actionLabel ? `<a href="${actionHref || "#"}">${actionLabel}</a>` : "");
    toastWrap.appendChild(el);
    setTimeout(() => { el.classList.add("out"); setTimeout(() => el.remove(), 320); }, 3200);
  }
  window.toast = toast;

  /* ------------------------------------------------------------- nav config */
  const NAV = [
    { label: "New In", href: "shop.html?sort=new" },
    { label: "Gift Sets", href: "shop.html?category=giftsets" },
    {
      label: "Clothing", mega: [
        { b: "Night Suits", s: "Crinkle muslin, 6m–6y", href: "shop.html?category=nightwear" },
        { b: "Frocks & Jablas", s: "Tie-shoulder, newborn+", href: "shop.html?category=frocks" },
        { b: "Rompers & Sets", s: "Zip sleepsuits, co-ords", href: "shop.html?category=rompers" },
        { b: "Joggers & Trousers", s: "Value 2-packs", href: "shop.html?category=bottoms" },
      ],
    },
    {
      label: "Essentials", mega: [
        { b: "Swaddles", s: "120cm organic muslin", href: "shop.html?category=swaddles" },
        { b: "Napkins & Wipes", s: "Sets of 6", href: "shop.html?category=essentials" },
        { b: "Bath & Care", s: "Towels, bibs, pillows", href: "shop.html?category=essentials" },
        { b: "Shop all essentials", s: "Everyday basics", href: "shop.html?category=essentials" },
      ],
    },
    { label: "Bestsellers", href: "shop.html?sort=popular" },
  ];

  /* -------------------------------------------------------- chrome injection */
  function buildChrome() {
    const page = document.body.dataset.page || "";

    /* header — appended straight onto <body> so position:sticky spans the whole page */
    const header = document.createElement("header");
    header.className = "site-header";
    header.id = "siteHeader";
    header.innerHTML = `
      <div class="container header-inner">
        <button class="icon-btn" id="menuToggle" aria-label="Open menu">${icon("menu")}</button>
        <a class="brand" href="index.html" aria-label="Parentree Organics — home">
          <span class="brand__mark">${leafMark()}</span>
          <span class="brand__name"><b>Parentree</b><span>Organics</span></span>
        </a>
        <nav aria-label="Primary"><ul class="primary-nav">${NAV.map(navItem).join("")}</ul></nav>
        <div class="header-actions">
          <button class="icon-btn search-open" aria-label="Search">${icon("search")}</button>
          <a class="icon-btn" href="wishlist.html" aria-label="Wishlist">${icon("heart")}
            <span class="icon-btn__count" data-wish-count>0</span></a>
          <button class="icon-btn" id="cartToggle" aria-label="Cart">${icon("bag")}
            <span class="icon-btn__count" data-cart-count>0</span></button>
        </div>
      </div>`;
    document.body.prepend(header);

    /* footer */
    const main = $("main") || document.body;
    main.insertAdjacentHTML("afterend", footerHTML());

    /* overlays */
    const ov = document.createElement("div");
    ov.innerHTML = `
      <div class="drawer-scrim" data-scrim></div>
      <aside class="mobile-drawer" id="mobileDrawer" aria-label="Menu">
        <div class="mobile-drawer__top">
          <a class="brand" href="index.html"><span class="brand__mark">${leafMark()}</span>
            <span class="brand__name"><b>Parentree</b><span>Organics</span></span></a>
          <button class="icon-btn" data-drawer-close aria-label="Close menu">${icon("close")}</button>
        </div>
        <nav class="mobile-drawer__nav">${NAV.map(mDrawerItem).join("")}
          <a href="shop.html">Shop all products ${icon("chevRight")}</a>
        </nav>
        <div class="mobile-drawer__foot">
          <a href="https://wa.me/919510633232">${icon("whatsapp")} +91 95106 33232</a>
          <a href="mailto:parentreeorganics@gmail.com">${icon("mail")} parentreeorganics@gmail.com</a>
        </div>
      </aside>

      <div class="search-panel" id="searchPanel">
        <div class="search-panel__box" role="dialog" aria-label="Search products">
          <div class="search-panel__field">
            ${icon("search")}
            <input type="search" id="searchInput" placeholder="Search night suits, swaddles, gift sets…" autocomplete="off">
            <button class="icon-btn" data-search-close aria-label="Close search">${icon("close")}</button>
          </div>
          <div class="search-results" id="searchResults"></div>
        </div>
      </div>

      <aside class="cart-drawer" id="cartDrawer" aria-label="Your cart">
        <div class="cart-drawer__head">
          <h3>Your basket <span data-cart-count-inline></span></h3>
          <button class="icon-btn" data-cart-close aria-label="Close basket">${icon("close")}</button>
        </div>
        <div id="cartDrawerBody" style="display:flex;flex-direction:column;flex:1;min-height:0"></div>
      </aside>

      <nav class="bottom-nav" aria-label="Mobile">
        <a href="index.html" data-nav="home"><span class="bn-ico">${icon("nHome")}</span>Home</a>
        <a href="shop.html" data-nav="shop"><span class="bn-ico">${icon("nGrid")}</span>Shop</a>
        <button class="bn-center" data-bn-search aria-label="Search"><span class="bn-ico">${icon("search")}</span>Search</button>
        <a href="wishlist.html" data-nav="wishlist"><span class="bn-ico">${icon("nHeart")}</span>
          <span class="icon-btn__count" data-wish-count>0</span>Saved</a>
        <a href="cart.html" data-nav="cart"><span class="bn-ico">${icon("nShop")}</span>
          <span class="icon-btn__count" data-cart-count>0</span>Bag</a>
      </nav>`;
    document.body.appendChild(ov);

    // active states
    $$(".bottom-nav a").forEach((a) => { if (a.dataset.nav === page) a.classList.add("is-active"); });

    wireChrome();
    syncBadges();
    renderCartDrawer();
  }

  function leafMark() {
    return `<svg viewBox="0 0 32 32" fill="none" aria-hidden="true">
      <path d="M16 3C9 6 5 12 5 19c0 5 3 9 8 10 0-7 1-12 4-16-2 5-2 11-2 16 6-1 12-6 12-15 0-5-4-9-11-11Z" fill="currentColor"/>
      <path d="M16 29c0-6 0-11 2-15" stroke="#F7FBFF" stroke-width="1.4" stroke-linecap="round"/></svg>`;
  }
  function navItem(n) {
    if (n.mega) {
      return `<li class="has-mega"><button aria-haspopup="true">${n.label} ${icon("chevDown")}</button>
        <div class="mega">${n.mega.map((m) => `<a href="${m.href}"><b>${m.b}</b><small>${m.s}</small></a>`).join("")}
        <div class="mega__promo">${icon("gift")} Free muslin blanket on orders over ₹2,600</div></div></li>`;
    }
    return `<li><a href="${n.href}">${n.label}</a></li>`;
  }
  function mDrawerItem(n) {
    if (n.mega) {
      return `<div class="m-acc"><button class="m-acc__head">${n.label} ${icon("chevDown")}</button>
        <div class="m-acc__body">${n.mega.map((m) => `<a href="${m.href}">${m.b}</a>`).join("")}</div></div>`;
    }
    return `<a href="${n.href}">${n.label} ${icon("chevRight")}</a>`;
  }

  function footerHTML() {
    return `<footer class="site-footer">
      <div class="container footer-top">
        <div class="footer-brand">
          <a class="brand" href="index.html"><span class="brand__mark" style="color:var(--sky-300)">${leafMark()}</span>
            <span class="brand__name"><b>Parentree</b><span>Organics</span></span></a>
          <p>GOTS-certified organic cotton essentials for newborns and little ones — made soft, made safe, made to be handed down.</p>
          <div class="footer-social">
            <a href="https://instagram.com" aria-label="Instagram">${icon("instagram")}</a>
            <a href="https://wa.me/919510633232" aria-label="WhatsApp">${icon("whatsapp")}</a>
            <a href="mailto:parentreeorganics@gmail.com" aria-label="Email">${icon("mail")}</a>
          </div>
        </div>
        <div class="footer-col">
          <h4>Shop</h4>
          <a href="shop.html?category=nightwear">Night Suits</a>
          <a href="shop.html?category=frocks">Frocks & Jablas</a>
          <a href="shop.html?category=swaddles">Swaddles</a>
          <a href="shop.html?category=giftsets">Gift Sets</a>
          <a href="shop.html?category=essentials">Essentials</a>
        </div>
        <div class="footer-col">
          <h4>Help</h4>
          <a href="#">Return & Exchange</a>
          <a href="#">Shipping Policy</a>
          <a href="#">Size Guide</a>
          <a href="#">Track Order</a>
          <a href="#">Contact Us</a>
        </div>
        <div class="footer-col">
          <h4>Reach us</h4>
          <a href="https://wa.me/919510633232">+91 95106 33232</a>
          <a href="mailto:parentreeorganics@gmail.com">parentreeorganics@gmail.com</a>
          <a href="#">Mon–Sat, 10am–6pm IST</a>
        </div>
      </div>
      <div class="container footer-bottom">
        <span>© ${new Date().getFullYear()} Parentree Organics. Redesign concept.</span>
        <span class="pay">Secure checkout <span>UPI</span><span>VISA</span><span>RuPay</span><span>COD</span></span>
      </div>
    </footer>`;
  }

  /* ------------------------------------------------------------- chrome wire */
  function wireChrome() {
    const scrim = $("[data-scrim]");
    const drawer = $("#mobileDrawer");
    const search = $("#searchPanel");
    const cart = $("#cartDrawer");
    const openScrim = () => { scrim.classList.add("open"); document.body.classList.add("no-scroll"); };
    const closeAll = () => {
      scrim.classList.remove("open");
      drawer.classList.remove("open"); cart.classList.remove("open"); search.classList.remove("open");
      document.body.classList.remove("no-scroll");
    };
    window.__closeChrome = closeAll;

    $("#menuToggle").addEventListener("click", () => { openScrim(); drawer.classList.add("open"); });
    $("#cartToggle").addEventListener("click", () => { openScrim(); cart.classList.add("open"); renderCartDrawer(); });
    const openSearch = () => {
      openScrim(); search.classList.add("open"); setTimeout(() => $("#searchInput").focus(), 60);
    };
    $(".search-open").addEventListener("click", openSearch);
    const bnSearch = $("[data-bn-search]");
    if (bnSearch) bnSearch.addEventListener("click", openSearch);
    scrim.addEventListener("click", closeAll);
    $$("[data-drawer-close],[data-cart-close],[data-search-close]").forEach((b) => b.addEventListener("click", closeAll));
    document.addEventListener("keydown", (e) => { if (e.key === "Escape") closeAll(); });

    $$(".m-acc__head").forEach((h) =>
      h.addEventListener("click", () => h.parentElement.classList.toggle("open")));

    /* sticky header */
    const header = $("#siteHeader");
    const onScroll = () => header.classList.toggle("is-stuck", window.scrollY > 8);
    onScroll(); window.addEventListener("scroll", onScroll, { passive: true });

    /* search */
    const input = $("#searchInput"), results = $("#searchResults");
    const runSearch = () => {
      const q = input.value.trim().toLowerCase();
      if (!q) { results.innerHTML = `<p class="search-hint">Try “swaddle”, “night suit”, “gift set”…</p>`; return; }
      const hits = window.PRODUCTS.filter((p) =>
        (p.name + " " + p.cat).toLowerCase().includes(q)).slice(0, 6);
      results.innerHTML = hits.length
        ? hits.map((p) => `<a href="product.html?id=${p.id}">
            <img src="${p.img}" alt="" loading="lazy">
            <span><b>${p.name}</b><br><span>${money(p.price)}</span></span></a>`).join("")
        : `<p class="search-hint">No matches for “${input.value}”.</p>`;
    };
    input.addEventListener("input", runSearch);
    runSearch();
  }

  /* --------------------------------------------------------------- badges */
  function syncBadges() {
    const c = Store.cartCount(), w = Store.wish.length;
    $$("[data-cart-count]").forEach((e) => { e.textContent = c; e.dataset.count = c; });
    $$("[data-wish-count]").forEach((e) => { e.textContent = w; e.dataset.count = w; });
    $$("[data-cart-count-inline]").forEach((e) => { e.textContent = c ? `· ${c}` : ""; });
    $$("[data-wish-btn]").forEach((b) => {
      const on = Store.inWish(b.dataset.wishBtn);
      b.classList.toggle("is-active", on);
      b.setAttribute("aria-pressed", on);
    });
  }

  /* ----------------------------------------------------------- cart drawer */
  function renderCartDrawer() {
    const body = $("#cartDrawerBody"); if (!body) return;
    if (!Store.cart.length) {
      body.innerHTML = `<div class="cart-empty">${icon("bag")}
        <p>Your basket is empty.</p>
        <a class="btn btn--outline btn--sm" href="shop.html" style="margin-top:16px">Start shopping</a></div>`;
      return;
    }
    const sub = Store.cartSubtotal();
    const th = window.SITE.freeGiftThreshold;
    const pct = Math.min(100, Math.round((sub / th) * 100));
    const left = Math.max(0, th - sub);
    body.innerHTML = `
      <div class="cart-progress">
        <span>${icon("gift")} ${left > 0
          ? `Add <b>${money(left)}</b> more for a free muslin blanket`
          : `<b>You’ve unlocked a free muslin blanket</b>`}</span>
        <div class="cart-progress__bar"><div class="cart-progress__fill" style="width:${pct}%"></div></div>
      </div>
      <div class="cart-items">${Store.cart.map(cartRow).join("")}</div>
      <div class="cart-drawer__foot">
        <div class="cart-line"><span>Subtotal</span><span>${money(sub)}</span></div>
        <div class="cart-line"><span>Delivery</span><span>Free</span></div>
        <div class="cart-line cart-line--total"><span>Total</span><span>${money(sub)}</span></div>
        <a class="btn btn--ink btn--block" href="cart.html">Checkout ${icon("arrowRight")}</a>
        <button class="btn btn--light btn--block" data-cart-close style="margin-top:8px">Keep shopping</button>
      </div>`;
    body.querySelector("[data-cart-close]").addEventListener("click", () => window.__closeChrome());
    wireCartRows(body);
  }
  function cartRow(l) {
    const p = window.getProduct(l.id); if (!p) return "";
    const key = Store.lineKey(l.id, l.color, l.size);
    const opt = [l.color, l.size].filter(Boolean).join(" · ");
    return `<div class="cart-item" data-key="${key}">
      <img class="cart-item__img" src="${p.img}" alt="${p.name}" loading="lazy">
      <div>
        <div class="cart-item__name">${p.name}</div>
        ${opt ? `<div class="cart-item__opt">${opt}</div>` : ""}
        <div class="qty">
          <button data-dec aria-label="Decrease">${icon("minus")}</button>
          <span>${l.qty}</span>
          <button data-inc aria-label="Increase">${icon("plus")}</button>
        </div>
      </div>
      <div style="text-align:right">
        <div class="cart-item__price">${money(p.price * l.qty)}</div>
        <button class="cart-item__remove" data-rm>Remove</button>
      </div>
    </div>`;
  }
  function wireCartRows(root) {
    $$(".cart-item", root).forEach((row) => {
      const key = row.dataset.key;
      const cur = () => Store.cart.find((x) => Store.lineKey(x.id, x.color, x.size) === key);
      row.querySelector("[data-inc]").addEventListener("click", () => Store.setQty(key, (cur()?.qty || 1) + 1));
      row.querySelector("[data-dec]").addEventListener("click", () => Store.setQty(key, (cur()?.qty || 1) - 1));
      row.querySelector("[data-rm]").addEventListener("click", () => Store.removeLine(key));
    });
  }

  /* -------------------------------------------------------- product card */
  function productCard(p, opts = {}) {
    const catLabel = (window.CATEGORIES.find((c) => c.slug === p.cat) || {}).label || "";
    const badgeCls = p.badge === "Sale" ? " card__badge--sale"
      : /bestseller/i.test(p.badge || "") ? " card__badge--bestseller" : "";
    const sw = (p.colors || []).slice(0, 4)
      .map((c) => `<i style="background:${c[1]}"></i>`).join("");
    const wished = Store.inWish(p.id);
    return `<article class="card${opts.reveal ? " reveal" : ""}">
      <div class="card__media">
        ${p.badge ? `<span class="card__badge${badgeCls}">${p.badge}</span>` : ""}
        <button class="card__wish${wished ? " is-active" : ""}" data-wish-btn="${p.id}" aria-pressed="${wished}" aria-label="Save ${p.name}">${icon("heart")}</button>
        <img src="${p.img}" alt="${p.name}" loading="lazy" width="800" height="800">
        <button class="card__add" data-quick-add="${p.id}" aria-label="Add ${p.name} to basket">${icon("plus")}</button>
      </div>
      <div class="card__body">
        <span class="card__cat">${catLabel}</span>
        <h3 class="card__name"><a href="product.html?id=${p.id}">${p.name}</a></h3>
        <div class="rating-line">${stars(p.rating, 12)} <span>(${p.reviews})</span></div>
        ${sw ? `<div class="card__swatches">${sw}</div>` : ""}
        <div class="card__meta">
          <span class="card__price">${money(p.price)}</span>
          ${p.mrp && p.mrp > p.price ? `<span class="card__mrp">${money(p.mrp)}</span>
            <span class="card__off">-${p.discount}%</span>` : ""}
        </div>
      </div>
    </article>`;
  }
  window.productCard = productCard;

  /* delegated card actions */
  document.addEventListener("click", (e) => {
    const wb = e.target.closest("[data-wish-btn]");
    if (wb) {
      e.preventDefault();
      const on = Store.toggleWish(wb.dataset.wishBtn);
      const p = window.getProduct(wb.dataset.wishBtn);
      toast(on ? `Saved ${p.name.split("—")[0].trim()}` : "Removed from saved", "View", "wishlist.html");
      return;
    }
    const qa = e.target.closest("[data-quick-add]");
    if (qa) {
      e.preventDefault();
      const p = window.getProduct(qa.dataset.quickAdd);
      const color = p.colors && p.colors[0] ? p.colors[0][0] : "";
      const size = p.sizes && p.sizes.length ? p.sizes[Math.min(1, p.sizes.length - 1)] : "";
      Store.addToCart(p.id, { color, size, qty: 1 });
      toast(`Added ${p.name.split("—")[0].trim()} to basket`, "Checkout", "cart.html");
      const cd = $("#cartDrawer");
      if (cd) { $("[data-scrim]").classList.add("open"); cd.classList.add("open"); document.body.classList.add("no-scroll"); }
    }
  });

  document.addEventListener("store:change", () => { syncBadges(); renderCartDrawer(); });

  /* ------------------------------------------------------------- reveal obs */
  function initReveal() {
    const els = $$(".reveal:not(.in)");
    if (!els.length) return;
    if (!("IntersectionObserver" in window)) { els.forEach((e) => e.classList.add("in")); return; }
    const vh = window.innerHeight || 800;
    const io = new IntersectionObserver((ents) => {
      ents.forEach((en) => { if (en.isIntersecting) { en.target.classList.add("in"); io.unobserve(en.target); } });
    }, { rootMargin: "0px 0px -6% 0px" });
    els.forEach((e) => {
      // anything already near the viewport shows immediately (no wait for a scroll)
      if (e.getBoundingClientRect().top < vh * 1.1) e.classList.add("in");
      else io.observe(e);
    });
    // safety net: never leave content hidden if the observer never fires
    clearTimeout(initReveal._t);
    initReveal._t = setTimeout(() => $$(".reveal:not(.in)").forEach((e) => e.classList.add("in")), 2600);
  }
  window.initReveal = initReveal;

  /* --------------------------------------------------------------- boot */
  document.addEventListener("DOMContentLoaded", () => {
    buildChrome();
    hydrateIcons(document.body);
    initReveal();
    document.dispatchEvent(new CustomEvent("chrome:ready"));
  });
})();
