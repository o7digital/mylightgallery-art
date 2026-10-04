import type { APIRoute } from 'astro';
import { siteUrl } from '../lib/seoRoutes';
export const prerender = false;
export const GET: APIRoute = () => new Response(
  process.env.VERCEL_ENV === 'preview'
    ? 'User-agent: *\nDisallow: /\n'
    : `User-agent: *\nAllow: /\nDisallow: /api/\n\nSitemap: ${siteUrl}/sitemap.xml\n`,
  { headers: { 'Content-Type': 'text/plain; charset=utf-8' } },
);
