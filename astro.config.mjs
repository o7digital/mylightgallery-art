// @ts-check
import { defineConfig } from 'astro/config';
import vercel from '@astrojs/vercel';

export default defineConfig({
  adapter: vercel({ mode: 'serverless' }),
  output: 'server',
  site: 'https://www.mylightartgallery.com',
});
