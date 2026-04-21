import { defaultCache } from '@serwist/next/worker'
import type { PrecacheEntry, SerwistGlobalConfig } from 'serwist'
import { NetworkFirst, Serwist } from 'serwist'

declare global {
  interface WorkerGlobalScope extends SerwistGlobalConfig {
    __SW_MANIFEST: (PrecacheEntry | string)[] | undefined
  }
}

// Cast self to the augmented WorkerGlobalScope that includes __SW_MANIFEST
// (ServiceWorkerGlobalScope is not in dom lib; WorkerGlobalScope is augmented above)
const sw = self as unknown as WorkerGlobalScope

const serwist = new Serwist({
  precacheEntries: sw.__SW_MANIFEST,
  skipWaiting: true,
  clientsClaim: true,
  navigationPreload: true,
  runtimeCaching: [
    {
      matcher: ({ url }: { url: URL }) => url.pathname.startsWith('/api/questions/'),
      handler: new NetworkFirst({
        cacheName: 'questions-cache',
        networkTimeoutSeconds: 3,
      }),
    },
    ...defaultCache,
  ],
})

serwist.addEventListeners()
