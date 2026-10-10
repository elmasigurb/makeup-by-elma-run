# Production preparation

The application is prepared for a future Cloudflare Pages deployment. Nothing
in this repository changes DNS or the existing Squarespace website.

## Cloudflare Pages build settings

- Framework preset: `Vite`
- Build command: `npm run build`
- Build output directory: `dist`
- Production branch: choose the branch you intend to publish

Cloudflare Pages serves the route-specific files generated in `dist` (for
example `portfolio.html`, available at `/portfolio`) before using its built-in SPA fallback. Do not
add a top-level `404.html`; Pages uses the absence of that file to route unknown
application paths back to the React app.

Admin URLs intentionally remain crawlable in `robots.txt` so crawlers can see
their `X-Robots-Tag: noindex` response header. Blocking them in `robots.txt`
could prevent a crawler from seeing that stronger no-index instruction. They
are omitted from the sitemap and also receive client-side `noindex` metadata.

## Public build variables

Add these in **Cloudflare Pages → Settings → Environment variables** for
Production and Preview as appropriate:

```text
VITE_SUPABASE_URL=https://YOUR-PROJECT-REF.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=sb_publishable_YOUR_KEY
```

Vite exposes every `VITE_*` value to browsers. Only the Supabase project URL
and publishable key belong here. Never add a service-role key, Resend API key,
admin password, inquiry hash salt, or other secret.

## Services deployed separately

The booking form depends on the Supabase Edge Function
`submit-booking-inquiry`. Database migrations, Row Level Security policies,
Storage policies, the function, and its secrets are deployed through Supabase,
not Cloudflare Pages. See `supabase/README.md` for the exact setup and testing
steps. Email notifications are not production-ready until a controlled inquiry
has been saved, the function log confirms the provider response, and the email
arrives in the configured inbox.

## SEO content and social artwork

- Edit public-page titles and descriptions in `src/data/seo.json`.
- `npm run build` generates route-specific HTML from that file.
- Replace `public/og-preview.png` later if desired, keeping a 1200×630 canvas.
  The current asset uses only the approved `public/logo.png`, centered without
  distortion on the existing ivory brand color.
- Update `public/sitemap.xml` when adding or removing indexable public routes.

## Domain cutover (later)

Keep Squarespace connected until the Pages preview domain has been fully
tested. Only then add the custom domain in Cloudflare and follow the DNS records
Cloudflare provides. Do not disconnect Squarespace or change DNS during the
preparation stage.
