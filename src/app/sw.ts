import { defaultCache } from '@serwist/next/worker';
import { NetworkOnly, Serwist } from 'serwist';
import type { PrecacheEntry, RuntimeCaching, SerwistGlobalConfig } from 'serwist';

// Declara o tipo de `self.__SW_MANIFEST` para o TypeScript.
// `injectionPoint` é a string substituída pelo manifesto real de precache.
declare global {
  interface WorkerGlobalScope extends SerwistGlobalConfig {
    __SW_MANIFEST: (PrecacheEntry | string)[] | undefined;
  }
}
declare const self: ServiceWorkerGlobalScope;

// O `defaultCache` do Serwist tem uma regra "apanha tudo" para pedidos
// cross-origin (NetworkFirst, cache até 1h) — isso inclui as chamadas
// REST/Auth ao Supabase. Se a rede demorar/oscilar (ex.: ao reabrir a app
// em 4G), o Service Worker serve dados antigos em cache — como o estado de
// "confirmado" de antes da última alteração. Esta regra intercepta os
// pedidos ao Supabase ANTES da regra genérica (a ordem do array importa) e
// força sempre ida à rede, nunca cache.
const supabaseHost = process.env.NEXT_PUBLIC_SUPABASE_URL
  ? new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).hostname
  : undefined;

const noCacheApiRuntimeCaching: RuntimeCaching[] = supabaseHost
  ? [{
      matcher: ({ url }) => url.hostname === supabaseHost,
      handler: new NetworkOnly(),
    }]
  : [];

const serwist = new Serwist({
  precacheEntries: self.__SW_MANIFEST,
  precacheOptions: {
    cleanupOutdatedCaches: true,
  },
  skipWaiting: true,
  clientsClaim: true,
  navigationPreload: true,
  runtimeCaching: [...noCacheApiRuntimeCaching, ...defaultCache],
  fallbacks: {
    entries: [
      {
        url: '/offline',
        matcher({ request }) {
          return request.destination === 'document';
        },
      },
    ],
  },
});

serwist.addEventListeners();
