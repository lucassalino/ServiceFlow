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
  additionalPrecacheEntries: [{ url: '/offline', revision }],
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
