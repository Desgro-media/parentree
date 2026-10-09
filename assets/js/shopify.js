/* ==========================================================================
   Momira Organic — Shopify Storefront API catalog sync
   Fetches live products from Shopify and replaces window.PRODUCTS with them.
   Falls back to the static demo catalog in data.js whenever the store has
   no products yet (or the request fails) — window.Catalog.ready resolves
   either way, so pages never hang on a slow/broken connection.
   ========================================================================== */
(function () {
  "use strict";

  const SHOPIFY_DOMAIN = "a9mpaw-sd.myshopify.com";
  const STOREFRONT_TOKEN = "50653f6a245c68db2733ce97f0d4d627";
  /* Shopify supports each API version for ~12 months and silently serves the
     oldest supported one after that (2024-10 was already being served as
     2025-10). Bump this a couple of times a year and re-test the two queries. */
  const API_VERSION = "2026-07";
  const ENDPOINT = `https://${SHOPIFY_DOMAIN}/api/${API_VERSION}/graphql.json`;

  async function shopifyFetch(query, variables, timeoutMs = 8000) {
    /* no timeout would let a stalled request hold every page hostage, since
       app.js waits on Catalog.ready before rendering */
    const ctl = new AbortController();
    const timer = setTimeout(() => ctl.abort(), timeoutMs);
    try {
      const res = await fetch(ENDPOINT, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Shopify-Storefront-Access-Token": STOREFRONT_TOKEN,
        },
        body: JSON.stringify({ query, variables }),
        signal: ctl.signal,
      });
      if (!res.ok) throw new Error("Shopify Storefront API error " + res.status);
      const json = await res.json();
      if (json.errors) throw new Error(json.errors.map((e) => e.message).join("; "));
      return json.data;
    } finally {
      clearTimeout(timer);
    }
  }

  /* option values from Shopify are plain strings ("Sage", "Rust") with no
     hex code attached — approximate a swatch colour by keyword match. */
  const COLOR_HEX = {
    black: "#2b2b2b", white: "#f3efe4", ivory: "#ede6d6", cream: "#f2ecd9", natural: "#ede5d3",
    sage: "#cdd9b8", green: "#9fae86", olive: "#b9b189", blue: "#cfe0ef", navy: "#3f4d63",
    pink: "#eccfca", blush: "#e7ccc9", peach: "#f2d7c4", yellow: "#f2e2a8", mustard: "#e9c979",
    gold: "#e9c979", brown: "#c7ad8e", rust: "#c98a63", tan: "#c9a978", grey: "#dfe3e7",
    gray: "#dfe3e7", red: "#c96a5a", purple: "#c9b8d8", orange: "#e6b877", beige: "#d8c7ad",
  };
  function colorHex(name) {
    const key = String(name || "").toLowerCase().trim();
    for (const k in COLOR_HEX) if (key.includes(k)) return COLOR_HEX[k];
    return "#d8cfc0";
  }

  const CAT_SLUGS = (window.CATEGORIES || []).filter((c) => c.slug !== "all");
  function guessCategory(productType, tags) {
    const hay = (productType + " " + tags.join(" ")).toLowerCase();
    const hit = CAT_SLUGS.find((c) => hay.includes(c.slug) || hay.includes(c.label.toLowerCase()));
    return hit ? hit.slug : "essentials";
  }
  function guessBadge(tags) {
    const t = tags.map((x) => x.toLowerCase());
    if (t.includes("bestseller")) return "Bestseller";
    if (t.includes("new")) return "New";
    if (t.includes("sale")) return "Sale";
    if (t.includes("trending")) return "Trending";
    return null;
  }

  const PRODUCTS_QUERY = `
    query CatalogProducts($cursor: String) {
      products(first: 100, after: $cursor) {
        pageInfo { hasNextPage endCursor }
        edges {
          node {
            id
            handle
            title
            description
            tags
            productType
            images(first: 6) { edges { node { url altText } } }
            options { name values }
            variants(first: 100) {
              edges {
                node {
                  id
                  availableForSale
                  price { amount }
                  compareAtPrice { amount }
                  selectedOptions { name value }
                }
              }
            }
          }
        }
      }
    }`;

  /* The storefront only models two option dimensions: colour and size/age.
     Name your Shopify options "Color"/"Colour" and "Size"/"Age" — anything else
     (e.g. "Material") can't be told apart here and is warned about below. */
  const COLOR_RX = /colou?r/i;
  const SIZE_RX = /^(size|age)/i;

  function mapProduct(node) {
    const images = node.images.edges.map((e) => e.node.url);
    const options = node.options || [];
    const colorOpt = options.find((o) => COLOR_RX.test(o.name));
    const sizeOpt = options.find((o) => SIZE_RX.test(o.name));

    const optValue = (v, rx) => (v.selectedOptions.find((o) => rx.test(o.name)) || {}).value || "";
    const variants = node.variants.edges.map((e) => {
      const v = e.node;
      const price = Number(v.price.amount);
      const cmp = v.compareAtPrice ? Number(v.compareAtPrice.amount) : 0;
      return {
        id: v.id,
        available: v.availableForSale,
        price,
        mrp: cmp > price ? cmp : 0,
        color: optValue(v, COLOR_RX),
        size: optValue(v, SIZE_RX),
      };
    });

    const unmodelled = options.filter((o) => o !== colorOpt && o !== sizeOpt && o.values.length > 1);
    if (unmodelled.length) {
      console.warn(`Shopify product "${node.handle}" varies by ${unmodelled.map((o) => o.name).join(", ")}, ` +
        "which the storefront can't select — rename the option to Color/Size or split the product.");
    }

    /* listing price = cheapest purchasable variant (all variants if sold out) */
    const pool = variants.some((v) => v.available) ? variants.filter((v) => v.available) : variants;
    const shown = pool.reduce((a, b) => (b.price < a.price ? b : a), pool[0] || { price: 0, mrp: 0 });
    const price = shown.price;
    const mrp = shown.mrp;

    return {
      id: node.handle,
      variants,
      soldOut: variants.length > 0 && !variants.some((v) => v.available),
      priceVaries: variants.some((v) => v.price !== variants[0].price),
      name: node.title,
      cat: guessCategory(node.productType || "", node.tags || []),
      price, mrp,
      discount: mrp && mrp > price ? Math.round((1 - price / mrp) * 100) : 0,
      img: images[0] || "assets/img/products/gs-3pcs-welcome.jpg",
      badge: guessBadge(node.tags || []),
      rating: 0, reviews: 0,
      colors: colorOpt ? colorOpt.values.map((v) => [v, colorHex(v)]) : [],
      sizes: sizeOpt ? sizeOpt.values : [],
      blurb: node.description || "",
      features: [],
    };
  }

  async function fetchAllProducts() {
    let cursor = null, out = [];
    for (let i = 0; i < 10; i++) {
      const data = await shopifyFetch(PRODUCTS_QUERY, { cursor });
      out = out.concat(data.products.edges.map((e) => e.node));
      if (!data.products.pageInfo.hasNextPage) break;
      cursor = data.products.pageInfo.endCursor;
    }
    return out;
  }

  /* Which Shopify variant does a basket line ({color, size}) point at?
     Returns null rather than guessing — a wrong-size order is worse than a
     blocked checkout. Static demo products have no `variants` and return null. */
  function resolveVariant(product, sel) {
    const vs = (product && product.variants) || [];
    if (!vs.length) return null;
    if (vs.length === 1) return vs[0];
    const color = (sel && sel.color) || "", size = (sel && sel.size) || "";
    const hits = vs.filter((v) => v.color === color && v.size === size);
    return hits.find((v) => v.available) || hits[0] || null;
  }

  /* real Shopify-hosted checkout — used only once live products are in cart.
     Shopify does NOT reject sold-out lines: it returns a cart with quantity 0
     (or a reduced quantity) plus a `warnings` entry and an empty-looking
     checkout URL. So compare what came back with what we asked for. */
  async function createCheckout(lines) {
    const mutation = `
      mutation CreateCart($lines: [CartLineInput!]!) {
        cartCreate(input: { lines: $lines }) {
          cart {
            checkoutUrl
            lines(first: 100) {
              edges { node { quantity merchandise { ... on ProductVariant { id } } } }
            }
          }
          userErrors { message }
          warnings { code message }
        }
      }`;
    const data = await shopifyFetch(mutation, {
      lines: lines.map((l) => ({ merchandiseId: l.variantId, quantity: l.quantity })),
    }, 15000);
    const out = data.cartCreate;
    if (out.userErrors && out.userErrors.length) {
      throw new Error(out.userErrors.map((e) => e.message).join("; "));
    }

    const got = {};
    out.cart.lines.edges.forEach((e) => {
      const id = e.node.merchandise && e.node.merchandise.id;
      if (id) got[id] = (got[id] || 0) + e.node.quantity;
    });
    const want = {};
    lines.forEach((l) => { want[l.variantId] = (want[l.variantId] || 0) + l.quantity; });
    const short = Object.keys(want).some((id) => (got[id] || 0) < want[id]);

    if (short || (out.warnings && out.warnings.length)) {
      const err = new Error("Basket changed at checkout");
      err.code = "UNAVAILABLE";
      err.userMessage = (out.warnings || []).map((w) => w.message).join(" ")
        || "Some items in your basket are no longer available in that quantity.";
      throw err;
    }
    return out.cart.checkoutUrl;
  }

  let live = false;
  const ready = (async () => {
    try {
      const nodes = await fetchAllProducts();
      if (nodes.length) {
        window.PRODUCTS = nodes.map(mapProduct);
        live = true;
      }
      /* else: no products in Shopify yet — keep the static demo catalog */
    } catch (err) {
      console.warn("Shopify catalog sync failed, showing demo catalog instead.", err);
    }
  })();

  window.Catalog = {
    ready,
    isLive: () => live,
    resolveVariant,
    createCheckout,
  };
})();
