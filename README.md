# Momira Organic — website concept

A modern, mobile-first e-commerce front-end for **Momira Organic** (GOTS-certified
organic cotton sleepwear/babywear), built to the client's **Option 02 — Ivory + Sage**
brand specification. Static site, card-led interface, no build step.

Product data, copy and photography are placeholder/demo content re-used from an earlier
build — swap them for Momira's real catalogue and photography (see *Swapping in real
data* below). The footer's contact details (`+91 9510633232`, `parentreeorganics@gmail.com`) were
copied from parentree.co; they live in one place — `window.SITE` in `assets/js/data.js` — and
feed the footer, the mobile menu and the WhatsApp/email icons. The footer's opening hours
(`Mon–Sat, 10am–6pm IST`) and the "Redesign concept" line in `app.js` are still placeholders.

## Run it

```bash
# from this folder
python -m http.server 8777
# then open http://localhost:8777
```

Any static host works (Netlify, Vercel, GitHub Pages, S3, cPanel…). Just upload the folder.

## Pages

| File | Purpose |
|------|---------|
| `index.html` | Home — announcement bar, 3-slide hero slideshow, best sellers, shop-by-collection, shop-by-age, why-organic benefits, "why muslin" banner, gifting, customer-stories review row, Instagram community, newsletter (section order follows the old parentree.co landing page) |
| `shop.html` | Catalogue with category chips + sort (`?category=`, `?age=`, `?sort=`, `?q=`) |
| `product.html` | Product detail (`?id=`) — gallery, colour/size pickers, accordions, **customer reviews (read + write)**, related items, sticky mobile buy-bar |
| `cart.html` | Basket + order summary, promo codes (`WELCOME10`, `ORGANIC15`), free-gift progress |
| `wishlist.html` | Saved items + "add all to basket" |

## Structure

```
assets/
  css/styles.css     one design system — tokens, components, responsive rules
  js/
    data.js          product catalogue + site content (edit this to change products)
    app.js           shared runtime: header/footer/nav injection, icons, cart + wishlist
                     state (localStorage), search, cart drawer, toasts, reveal-on-scroll
    reviews.js       window.Reviews — the ONE review store (see "Reviews" below)
    home.js          homepage section renderers + the hero fade-slideshow + the customer-stories cards
    shop.js          catalogue filtering + sorting
    product.js       PDP logic
    cart.js          basket page
    wishlist.js      saved-items page
  img/
    hero/ (slideshow slides)  banners/ (why-muslin, collage)  community/ (Instagram grid)
    products/  age/  lifestyle/
```

## Design system — brand spec "Option 02: Ivory + Sage"

- **Palette:** Warm Ivory `#F9F1E6` (primary field, ~50–65% of the page), Deep Sage
  `#566752` (logo, headings, buttons, icons, ~20–30%), Sage Mist `#AEB2A1` and Warm
  Taupe `#9C8F80` (soft neutrals), Dusty Blue `#B7C6CC` and Blush Beige `#EADDD3`
  (limited seasonal/soft accents). One addition beyond the brand book: a muted terracotta
  **Clay** (`--clay`) used sparingly for sale tags and the wishlist heart, since the spec
  has no alert colour of its own. All tokens live at the top of `styles.css`, named for
  their role (`--ivory`, `--sage-600`, `--taupe`, `--clay`, `--gold` …) per the brand
  document's developer-handoff request for reusable design tokens.
- **Logo:** the client supplied the `momira` wordmark as a flattened image inside their
  spec doc, not a vector file. `sproutMark()` in `app.js` recreates the two-leaf sprout
  as inline SVG in Deep Sage, paired with the wordmark set in Quicksand (a rounded
  geometric sans chosen to sit close to the supplied lettering). **Swap in the real
  vector logo** the moment it's available — see `sproutMark()` and the three `brand__mark`
  call sites in `app.js`.
- **Hero:** a three-slide crossfade slideshow of finished campaign artwork (headline and
  "Shop now" are baked into `assets/img/hero/slide-N.jpg`), so slides are never cropped — the
  stage keeps the images' 3:2 ratio and the controls sit underneath. Autoplays every 6s;
  pauses on hover / keyboard focus and via the pause button; swipe, arrow keys and dots work;
  no autoplay under `prefers-reduced-motion`. Each slide is one link — edit the `href`s in
  `index.html`. To add a slide, add another `.hero-slide` block; the dots are generated.
- **Announcement bar:** a scrolling strip above the header on every page (messages are in
  `buildChrome()` in `app.js`).
- **Wide banners:** `banners/why-muslin.jpg` and `banners/little-moments.jpg` are art with
  small baked-in text, so the muslin one swaps to a live-text card below 1100px wide.
- **Product cards:** a layered "postcard" treatment — an offset sage/blush shadow-card
  peeks out on hover, badges are cut like a tag (not a plain pill), category labels carry
  a small leaf-bullet. Moderate corner radius throughout, per spec.
- **Type:** Quicksand (rounded display — headings + hero) + Nunito (body/UI), from Google Fonts.
- **Navigation:** a floating pill — `.header-inner` is a fully-rounded bar that detaches
  and floats over the page (`position: sticky`), toned down from glass to a mostly-solid
  ivory finish (light blur only) to stay in line with "avoid glossy effects". The mobile
  bottom tab bar (Home · Shop · Search · Saved · Bag) matches.
- **Icons:** hand-built inline SVG set in `app.js` (`icon(name)`), with a separate filled
  set for the mobile bottom navigation. Markup can drop `SPRITE_NAME` tokens which are
  hydrated on load. The favourites heart is filled everywhere — Clay when saved / on the
  nav icon, muted taupe on unsaved product cards.

## Reviews

Every review goes through one module, `assets/js/reviews.js` (`window.Reviews`), so the
places that show reviews can never drift apart:

| Where | What it does with `window.Reviews` |
|-------|------------------------------------|
| Product page → **Customer reviews** | lists that product's own reviews (newest first), with the earlier customer reviews always shown beneath them so the section is never blank; signed-in customers write one (star picker + text; sign-in prompt otherwise; one review per product per account) |
| Home → **Customer stories** | a looping row of review cards that glides left to right (three in view; two on tablets; one plus a peek of the next on phones; it pauses on hover/focus/press and doesn't animate under reduced-motion). The newest reviews across *all* products (4★ and up, 20+ characters, up to 6) come first, each linking back to its product — a review written on any product page appears here by itself — **followed by all the earlier reviews, which are never pushed out** |
| Product cards / product page rating line | star rating + count = the catalogue's own rating plus written reviews |

The four earlier reviews live in `window.REVIEWS_SEED` (`data.js`; exposed as `Reviews.earlier()`). They are
about Momira overall, not tied to a product, so they are labelled that way on product pages and don't count
towards a product's star rating. New reviews are always added in front of them, never in place of them.
Review text is customer-written, so everything is rendered through `escHtml`. Names are shown as
"Priya S.", never in full.

**Important — reviews are not shared yet.** Like `auth.js` and the basket, the store is
front-end-only: reviews are saved in the browser's `localStorage` (`ptree_reviews_v1`), so a review is
visible to the person who wrote it, not to other shoppers. To make them shared, replace the small
READ / WRITE block at the top of `reviews.js` with calls to a real service (Judge.me, Yotpo, Loox,
Shopify metaobjects, or your own API) and keep the `window.Reviews` surface (`ready`, `all`,
`forProduct`, `earlier`, `featured`, `stats`, `hasReviewed`, `submit`) — no page needs to change. Whatever backs it
should return **approved** reviews only; there is no moderation or spam protection in the placeholder.

## State

Basket and wishlist persist in `localStorage` (`ptree_cart_v1`, `ptree_wish_v1`) — they
survive refreshes and tab closes. There is no backend; "Proceed to checkout" is a stub.

## Swapping in real data

Edit `assets/js/data.js` — each product is one `P({ … })` entry, plus the `SITE` object
at the top (name, contact details). Drop new images into `assets/img/products/` and
reference them by filename. Categories are declared in `window.CATEGORIES`.
