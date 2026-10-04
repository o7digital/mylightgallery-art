// @ts-check
import { defineConfig } from 'astro/config';
import vercel from '@astrojs/vercel';

export default defineConfig({
  adapter: vercel({
    imageService: true,
    imagesConfig: {
      sizes: [320, 480, 640, 768, 960, 1200, 1600, 1920],
      formats: ['image/webp'],
      minimumCacheTTL: 86400,
      remotePatterns: [{ protocol: 'https', hostname: 'wp-mylightartgallery.o7digitalgroup.com', pathname: '/wp-content/**' }],
    },
  }),
  image: {
    remotePatterns: [{ protocol: 'https', hostname: 'wp-mylightartgallery.o7digitalgroup.com', pathname: '/wp-content/**' }],
  },
  output: 'server',
  site: 'https://www.mylightartgallery.com',
});
