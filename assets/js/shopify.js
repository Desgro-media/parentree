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
  const API_VERSION = "2024-10";
  const ENDPOINT = `https://${SHOPIFY_DOMAIN}/api/${API_VERSION}/graphql.json`;

  async function shopifyFetch(query, variables) {
    const res = await fetch(ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Shopify-Storefront-Access-Token": STOREFRONT_TOKEN,
      },
      body: JSON.stringify({ query, variables }),
    });
    if (!res.ok) throw new Error("Shopify Storefront API error " + res.status);
    const json = await res.json();
    if (json.errors) throw new Error(json.errors.map((e) => e.message).join("; "));
    return json.data;
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

  function mapProduct(node) {
    const images = node.images.edges.map((e) => e.node.url);
    const variants = node.variants.edges.map((e) => e.node);
    const firstAvailable = variants.find((v) => v.availableForSale) || variants[0] || null;
    const price = firstAvailable ? Number(firstAvailable.price.amount) : 0;
    const mrpRaw = firstAvailable && firstAvailable.compareAtPrice ? Number(firstAvailable.compareAtPrice.amount) : 0;
    const mrp = mrpRaw > price ? mrpRaw : 0;

    const options = node.options || [];
    const colorOpt = options.find((o) => /colou?r/i.test(o.name));
    const sizeOpt = options.find((o) => /size|age/i.test(o.name));

    const variantIndex = {};
    variants.forEach((v) => {
      const color = (v.selectedOptions.find((o) => /colou?r/i.test(o.name)) || {}).value || "";
      const size = (v.selectedOptions.find((o) => /size|age/i.test(o.name)) || {}).value || "";
      variantIndex[color + "::" + size] = v.id;
    });

    return {
      id: node.handle,
      variantId: firstAvailable ? firstAvailable.id : null,
      variantIndex,
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

  /* real Shopify-hosted checkout — used only once live products are in cart */
  async function createCheckout(lines) {
    const mutation = `
      mutation CreateCart($lines: [CartLineInput!]!) {
        cartCreate(input: { lines: $lines }) {
          cart { checkoutUrl }
          userErrors { message }
        }
      }`;
    const data = await shopifyFetch(mutation, {
      lines: lines.map((l) => ({ merchandiseId: l.variantId, quantity: l.quantity })),
    });
    const errs = data.cartCreate.userErrors;
    if (errs && errs.length) throw new Error(errs.map((e) => e.message).join("; "));
    return data.cartCreate.cart.checkoutUrl;
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
    createCheckout,
  };
})();
