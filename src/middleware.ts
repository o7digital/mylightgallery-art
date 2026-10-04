import { defineMiddleware } from 'astro:middleware';

export const onRequest = defineMiddleware(async (_context, next) => {
  const response = await next();
  if (process.env.VERCEL_ENV === 'preview' || response.status >= 400 || _context.url.pathname.startsWith('/api/')) {
    response.headers.set('X-Robots-Tag', 'noindex, nofollow');
  }
  return response;
});
