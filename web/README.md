# Athena Superpack — static site

Plain **HTML, CSS, and a small amount of vanilla JavaScript**. No React, no Next.js, no build toolchain beyond optional page generation.

## Local preview

```bash
cd web
npm run dev
```

Open the URL shown by `serve` (usually http://localhost:3000).

## Regenerate HTML (after editing `data/site-data.json` or `build.mjs`)

```bash
cd web
npm run build
```

## Structure

- `index.html`, `about/`, `contact/`, `products/`, `sustainability/` — pages
- `css/styles.css` — all styling
- `js/main.js` — mobile menu, scroll reveals, product search filter, enquiry form
- `images/` — product and brand assets
- `build.mjs` + `data/site-data.json` — optional generator for multi-page content
