# Momira Organic — website concept

A modern, mobile-first e-commerce front-end for **Momira Organic** (GOTS-certified
organic cotton sleepwear/babywear), built to the client's **Option 02 — Ivory + Sage**
brand specification. Static site, card-led interface, no build step.

Product data, copy and photography are placeholder/demo content re-used from an earlier
build — swap them for Momira's real catalogue and photography (see *Swapping in real
data* below). Contact details in the footer (`+91 98765 43210`, `hello@momiraorganic.com`)
are **placeholders** — replace with Momira's real numbers before this goes live.

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
| `index.html` | Home — framed hero, best sellers, collections, "why muslin", benefits, shop-by-age, gifting, testimonials, Instagram, newsletter |
| `shop.html` | Catalogue with category chips + sort (`?category=`, `?age=`, `?sort=`, `?q=`) |
| `product.html` | Product detail (`?id=`) — gallery, colour/size pickers, accordions, related items, sticky mobile buy-bar |
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
    home.js          homepage section renderers
    shop.js          catalogue filtering + sorting
    product.js       PDP logic
    cart.js          basket page
    wishlist.js      saved-items page
  img/
    bg/ (hero photo)  products/  age/  lifestyle/
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
- **Hero:** a framed, arch-topped portrait photo on a plain ivory field (not a full-bleed
  photo wash) — chosen to read as designed rather than templated, and to keep the page
  light per the brand direction ("avoid heavy gradients, glossy effects").
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

## State

Basket and wishlist persist in `localStorage` (`ptree_cart_v1`, `ptree_wish_v1`) — they
survive refreshes and tab closes. There is no backend; "Proceed to checkout" is a stub.

## Swapping in real data

Edit `assets/js/data.js` — each product is one `P({ … })` entry, plus the `SITE` object
at the top (name, contact details). Drop new images into `assets/img/products/` and
reference them by filename. Categories are declared in `window.CATEGORIES`.
