# Athena Superpack — Website

Production marketing site for **Athena Superpack Pvt. Ltd.** (Zapac packaging catalogue).

## Development

Static HTML/CSS site in `web/`:

```bash
cd web
npm run dev
```

Open the local URL from `serve` (typically http://localhost:3000).

To regenerate pages after changing catalogue data:

```bash
cd web
npm run build
```

## Content sources

- Zapac catalogue PDF (linked from the Products page)
- Verified contact details and warehouse addresses from the catalogue
- Product photography under `web/images/`

## Client follow-ups

- Approved logo asset (replace typographic wordmark if provided)
- High-resolution catalogue product photography for all eleven families
- Backend endpoint for the enquiry form (currently mailto + WhatsApp)
- Confirm any optional company history copy for the About page placeholder
