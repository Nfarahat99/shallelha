import Redis from 'ioredis'

const rawUrl = process.env.REDIS_URL
if (!rawUrl) throw new Error('REDIS_URL environment variable is required')

// Append ?family=0 only if not already present.
// REQUIRED for Railway: private network uses IPv6; without this ioredis
// defaults to IPv4-only DNS resolution and gets ECONNREFUSED.
const redisUrl = rawUrl.includes('family=0') ? rawUrl : `${rawUrl}?family=0`

export const redis = new Redis(redisUrl, {
  lazyConnect: true,
  connectTimeout: 15000,
  retryStrategy: (times) => Math.min(times * 30, 1000),
})

redis.on('error', (err) => {
  console.error('[Redis] Connection error:', err.message)
})
