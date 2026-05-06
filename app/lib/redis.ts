import Redis from 'ioredis'

let client: Redis | null = null

export function getRedis(): Redis {
  if (!client) {
    client = new Redis(process.env.REDIS_URL!, {
      lazyConnect: true,
      enableReadyCheck: false,
      maxRetriesPerRequest: 1,
      connectTimeout: 5000,
    })
    client.on('error', () => {})
  }
  return client
}

export async function rget<T>(key: string): Promise<T | null> {
  try {
    const raw = await getRedis().get(key)
    return raw ? (JSON.parse(raw) as T) : null
  } catch {
    return null
  }
}

export async function rset(key: string, value: unknown, ttlSeconds: number): Promise<void> {
  try {
    await getRedis().set(key, JSON.stringify(value), 'EX', ttlSeconds)
  } catch {
    // storage unavailable in dev without REDIS_URL
  }
}
