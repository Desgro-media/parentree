/* ==========================================================================
   Momira Organic — customer reviews (placeholder store)
   ONE place every review flows through:
     · product page   — lists reviews for that product and lets signed-in customers write one
     · home page      — the "Customer stories" slideshow shows the best of ALL reviews
     · product cards  — star rating + count include the written reviews
   so a review written on a product page shows up in the slideshow with no extra wiring.

   Like auth.js, this is front-end-only: reviews are kept in this browser's localStorage,
   so a review is visible to the person who wrote it, not yet to other shoppers. To make
   reviews shared, replace the READ/WRITE block below with calls to a real service
   (Judge.me / Yotpo / Loox, Shopify metaobjects, or your own API). Keep the window.Reviews
   surface — ready, all, forProduct, earlier, featured, stats, hasReviewed, submit — and none of the
   pages need to change. Whatever backs it should only return APPROVED reviews.
   ========================================================================== */
(function () {
  "use strict";

  const KEY = "ptree_reviews_v1";
  const MIN_TEXT = 10;
  const MAX_TEXT = 600;
  const FEATURED_MIN_RATING = 4;  // slideshow only features 4★ and up…
  const FEATURED_MIN_TEXT = 20;   // …that actually say something

  /* ---- READ / WRITE — swap this block for a backend ------------------------- */
  const read = () => {
    try { const v = JSON.parse(localStorage.getItem(KEY)); return Array.isArray(v) ? v : []; } catch { return []; }
  };
  const write = (list) => {
    try { localStorage.setItem(KEY, JSON.stringify(list)); return true; } catch { return false; }
  };
  let written = read();                       // reviews customers have submitted, newest first
  /* ---------------------------------------------------------------------------- */

  const seeds = () => window.REVIEWS_SEED || [];
  const newestFirst = (a, b) => (b.ts || 0) - (a.ts || 0);

  /* what callers get: no uid/email — that stays inside the store */
  const view = (r) => ({
    id: r.id, productId: r.productId || null, name: r.name, city: r.city || "",
    rating: r.rating, text: r.text, ts: r.ts || 0, verified: !!r.verified,
  });

  /* "Priya Sharma" -> "Priya S." — reviews are public, so don't publish full names */
  function publicName(full) {
    const parts = String(full || "").trim().split(/\s+/).filter(Boolean);
    if (!parts.length) return "A customer";
    return parts.length === 1 ? parts[0] : `${parts[0]} ${parts[parts.length - 1][0].toUpperCase()}.`;
  }

  const Reviews = {
    MIN_TEXT, MAX_TEXT, publicName,
    /* a backend adapter resolves this once its fetch is done; pages wait on it */
    ready: Promise.resolve(),

    /* every review, newest first, seed stories last */
    all() { return [...written].sort(newestFirst).concat(seeds()).map(view); },

    forProduct(productId) {
      return written.filter((r) => r.productId === productId).sort(newestFirst).map(view);
    },

    /* the reviews that were here before customers could write their own — the original
       customer stories. They are never removed: new reviews are added in front of them. */
    earlier() { return seeds().map(view); },

    /* the home-page slideshow: new reviews (good rating, real text, newest first — at most
       `limit` of them so the slideshow stays a sensible length) in front of ALL the earlier
       reviews. Earlier ones are never pushed out, and the slideshow is never empty. */
    featured(limit = 6) {
      const good = (r) => r.rating >= FEATURED_MIN_RATING && r.text.length >= FEATURED_MIN_TEXT;
      const fresh = [...written].sort(newestFirst).map(view).filter(good).slice(0, limit);
      return fresh.concat(seeds().map(view).filter(good));
    },

    /* rating shown on cards and the product page. A catalogue's own rating (the demo
       data's rating/reviews) counts as the baseline, and written reviews add to it. */
    stats(product) {
      const mine = written.filter((r) => r.productId === product.id);
      const baseN = Number(product.reviews) || 0;
      const count = baseN + mine.length;
      if (!count) return { count: 0, average: 0 };
      const sum = (Number(product.rating) || 0) * baseN + mine.reduce((s, r) => s + r.rating, 0);
      return { count, average: sum / count };
    },

    hasReviewed(productId) {
      const u = window.Auth && window.Auth.currentUser();
      return !!u && written.some((r) => r.productId === productId && r.uid === u.email);
    },

    /* { ok: true, review } or { ok: false, error } — the error is safe to show as-is */
    submit({ productId, rating, text }) {
      const user = window.Auth && window.Auth.currentUser();
      if (!user) return { ok: false, error: "Please sign in to write a review." };
      if (!window.getProduct(productId)) return { ok: false, error: "That product isn’t available." };

      rating = Math.round(Number(rating));
      if (!(rating >= 1 && rating <= 5)) return { ok: false, error: "Choose a star rating." };

      text = String(text || "").replace(/\s+/g, " ").trim();
      if (text.length < MIN_TEXT) return { ok: false, error: `Tell us a little more — at least ${MIN_TEXT} characters.` };
      if (text.length > MAX_TEXT) return { ok: false, error: `Please keep it under ${MAX_TEXT} characters.` };

      if (Reviews.hasReviewed(productId)) return { ok: false, error: "You’ve already reviewed this product." };

      const review = {
        id: "r-" + Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
        productId, rating, text, ts: Date.now(),
        name: publicName(user.name),
        uid: user.email,
      };
      const next = [review, ...written];
      if (!write(next)) return { ok: false, error: "Couldn’t save your review — browser storage is unavailable." };
      written = next;
      document.dispatchEvent(new CustomEvent("reviews:change", { detail: { review: view(review) } }));
      return { ok: true, review: view(review) };
    },
  };

  window.Reviews = Reviews;
})();
