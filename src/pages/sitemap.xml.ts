import type { APIRoute } from 'astro';
import { getProducts } from '../lib/wp';
import { siteUrl, languagePairs, escapeXml } from '../lib/seoRoutes';

export const prerender = false;
export const GET: APIRoute = async () => {
  const products = await getProducts(100);
  // Do not cache an incomplete sitemap when the content source is unavailable.
  if (!products.length) return new Response('Sitemap temporarily unavailable', { status: 503 });
  const entries: Array<{ es: string; en: string; image?: string | null }> = languagePairs.map(([es, en]) => ({ es, en }));
  for (let page = 2; page <= Math.ceil(products.length / 12); page++) {
    entries.push({ es: `/exhibitions?page=${page}`, en: `/en/exhibitions?page=${page}` });
  }
  for (const product of products) {
    entries.push({ es: `/obras/${encodeURIComponent(product.slug)}`, en: `/en/works/${encodeURIComponent(product.slug)}`, image: product.imageFull ?? product.image });
  }
  const url = (path: string) => escapeXml(new URL(path, siteUrl).href);
  const rows = entries.flatMap(({ es, en, image }) => [es, en].map(path => `<url><loc>${url(path)}</loc><xhtml:link rel="alternate" hreflang="es" href="${url(es)}"/><xhtml:link rel="alternate" hreflang="en" href="${url(en)}"/><xhtml:link rel="alternate" hreflang="x-default" href="${url(es)}"/>${image ? `<image:image><image:loc>${escapeXml(new URL(image, siteUrl).href)}</image:loc></image:image>` : ''}</url>`));
  return new Response(`<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">${rows.join('')}</urlset>`, {
    headers: { 'Content-Type': 'application/xml; charset=utf-8', 'Cache-Control': 'public, max-age=300, s-maxage=300, stale-while-revalidate=600' },
  });
};
