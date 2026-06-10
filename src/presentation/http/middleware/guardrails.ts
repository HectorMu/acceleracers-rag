import type { MiddlewareHandler } from 'hono'

const RATE_LIMIT_WINDOW = 60_000
const MAX_REQUESTS = 30
const requestLog = new Map<string, number[]>()

export function rateLimit(): MiddlewareHandler {
  return async (c, next) => {
    const ip = c.req.header('x-forwarded-for') || c.req.header('x-real-ip') || 'unknown'
    const now = Date.now()
    const timestamps = requestLog.get(ip) || []
    const recent = timestamps.filter(t => now - t < RATE_LIMIT_WINDOW)
    if (recent.length >= MAX_REQUESTS) {
      return c.json({ error: 'too many requests' }, 429)
    }
    recent.push(now)
    requestLog.set(ip, recent)
    await next()
  }
}

export function maxLength(max: number): MiddlewareHandler {
  return async (c, next) => {
    if (c.req.method === 'POST') {
      try {
        const body = await c.req.json()
        if (body.message && typeof body.message === 'string' && body.message.length > max) {
          return c.json({ error: `message must be under ${max} characters` }, 400)
        }
      } catch {
        // let downstream handle invalid JSON
      }
    }
    await next()
  }
}


