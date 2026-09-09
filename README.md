# Parentree Organics — website redesign concept

A modern, mobile-first e-commerce front-end for **Parentree Organics** (GOTS-certified
organic cotton babywear). Rebuilt from scratch as a static site with a pistachio + cream
palette and a clean, card-led interface inspired by the supplied app reference.

Product names, prices, copy and photography were sourced from the live store at
`parentree.co` and re-optimised for the web.

## Run it

It's a plain static site — no build step.

```bash
# from this folder
python -m http.server 8777
# then open http://localhost:8777
```

Any static host works (Netlify, Vercel, GitHub Pages, S3, cPanel…). Just upload the folder.

## Pages

| File | Purpose |
|------|---------|
| `index.html` | Home — hero, best sellers, collections, "why muslin", benefits, shop-by-age, gifting, testimonials, Instagram, newsletter |
| `shop.html` | Catalogue with category chips + sort (`?category=`, `?age=`, `?sort=`, `?q=`) |
| `product.html` | Product detail (`?id=`) — gallery, colour/size pickers, accordions, related items, sticky mobile buy-bar |
| `cart.html` | Basket + order summary, promo codes (`WELCOME10`, `ORGANIC15`), free-blanket progress |
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
    bg/ (hero background)  products/  age/  lifestyle/
```

## Design system — "Sky & Sunshine"

- **Palette:** sky blue (`--sky-*`, primary), sunshine yellow (`--sun-*`, used for star
  ratings), blush pink (`--blush-*`, sale prices) and paper white (`--paper`) grounds,
  slate-blue ink. All tokens live at the top of `styles.css`.
- **Navigation:** a floating glass pill — `.header-inner` is a fully-rounded blurred bar
  that detaches and floats over the hero and page content (`position: sticky`). The
  mobile bottom tab bar (Home · Shop · Search · Saved · Bag) is the same glass pill treatment.
- **Hero:** full-bleed background image (`assets/img/bg/hero.jpg`, portrait crop
  `hero-mobile.jpg`) with a left-to-right paper-white gradient wash for text contrast.
- **Type:** Quicksand (soft rounded display — headings + hero) + Nunito (body/UI), from Google Fonts.
- **Icons:** hand-built inline SVG set in `app.js` (`icon(name)`), with a separate
  filled set for the mobile bottom navigation. Markup can also drop `SPRITE_NAME`
  tokens which are hydrated on load. The favourites heart is a filled heart everywhere
  (blush pink in nav / when saved, grey on unsaved product cards).
- Subtle glassmorphism recurs on card badges, the buy-bar, drawers and the "Explore
  Our Story" button.

## State

Basket and wishlist persist in `localStorage` (`ptree_cart_v1`, `ptree_wish_v1`) — they
survive refreshes and tab closes. There is no backend; "Proceed to checkout" is a stub.

## Swapping in real data

Edit `assets/js/data.js` — each product is one `P({ … })` entry. Drop new images into
`assets/img/products/` and reference them by filename. Categories are declared in
`window.CATEGORIES`.
