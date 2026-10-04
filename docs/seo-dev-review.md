# Frontend SEO review on dev

These changes target the public Astro frontend. WordPress content and production hosting are not modified by this branch's Preview deployment.

## Changes to review

- One visible H1 on each home page, with mobile typography adjusted for the longer gallery heading.
- Dynamic sitemap with language alternates, paginated collections, artwork pages and artwork images. Currently 86 URLs, including 32 artworks in each language.
- Missing artworks and unknown pages return 404 with noindex; recognized artwork aliases redirect to the canonical slug.
- Canonicals and structured artwork URLs use the production domain. Legal pages now receive their own language alternates rather than home-page alternates.
- Duplicate artwork structured data removed; artist name completed and incorrectly formatted artwork width removed.
- Gallery phone/email aligned with the existing footer and artwork contacts. Legal documents retain their separate legal entity details.
- Repeated footer keyword lists removed.
- Shared Astro image component uses Vercel Image Optimization with WebP, responsive widths, original aspect ratios and explicit dimensions. Artwork zoom still uses the original image.
- First hero image has high fetch priority; remaining images are lazy-loaded. Full artwork sources are used to avoid enlarging small WordPress thumbnails.
- Preview pages receive noindex headers/meta; Preview robots.txt disallows crawling. Production robots.txt lists the production sitemap.
- Broken favicon references replaced with a local ML monogram SVG.
- Unavailable WordPress data no longer creates fake artwork pages from missing local fallback assets; an unavailable sitemap returns 503 rather than publishing an incomplete result.

## Validation

Run `npm run build` and, with Astro running locally, `python3 scripts/verify-seo.py`.

For a protected Vercel preview, run `python3 scripts/verify-seo.py <preview-url> --preview --vercel`.

The verifier checks the home pages, collections/pagination, contact and legal pages, artwork pages, canonical URLs, language alternates, structured data, image dimensions/srcsets, sitemap and HTTP 404 behavior. Preview mode also checks indexing protection.

Mobile browser checks cover text clipping and actual image loading on the home, collections and artwork pages. All 32 source artwork images were checked for HTTP 200 and image content types.

## Scope and release

Push and deploy `dev` as Preview only. Production release requires the user's validation. This work does not establish Google rankings or index coverage; Search Console data and field performance measurements remain separate validation steps.
