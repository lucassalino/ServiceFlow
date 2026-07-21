import type { NextConfig } from 'next';
import { spawnSync } from 'node:child_process';
import withSerwistInit from '@serwist/next';

// Uma revisão ajuda o Serwist a versionar a página pré-cacheada,
// evitando que respostas desatualizadas fiquem em cache indefinidamente.
const revision = spawnSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf-8' }).stdout?.trim()
  ?? crypto.randomUUID();

const withSerwist = withSerwistInit({
  swSrc: 'src/app/sw.ts',
  swDest: 'public/sw.js',
  disable: process.env.NODE_ENV === 'development',
  cacheOnNavigation: true,
  additionalPrecacheEntries: [
    { url: '/offline', revision },
    // Ícones da marca WIS — pré-cacheados para funcionarem offline.
    { url: '/favicon.ico', revision },
    { url: '/icons/icon-192.png', revision },
    { url: '/icons/icon-512.png', revision },
    { url: '/icons/maskable-192.png', revision },
    { url: '/icons/maskable-512.png', revision },
    { url: '/icons/apple-touch-icon.png', revision },
    { url: '/icons/icon.svg', revision },
    { url: '/og-image.png', revision },
  ],
});

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '**.supabase.co' },
      { protocol: 'https', hostname: 'lh3.googleusercontent.com' },
    ],
  },
};

export default withSerwist(nextConfig);

// Enable the OpenNext Cloudflare bindings during `next dev` so local
// development mirrors the Workers runtime. No-op outside dev.
import { initOpenNextCloudflareForDev } from '@opennextjs/cloudflare';
initOpenNextCloudflareForDev();
