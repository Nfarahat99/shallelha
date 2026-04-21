import { defaultCache } from '@serwist/next/worker'
import type { PrecacheEntry, SerwistGlobalConfig } from 'serwist'
import { Serwist } from 'serwist'

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
  runtimeCaching: [...defaultCache],
  // Question pre-cache rule added in 12-08
})

serwist.addEventListeners()
