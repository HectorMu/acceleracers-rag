import { Hono } from 'hono'
import type { AppConfig } from '../../../application/ports/config.js'

export function healthRoute(config: AppConfig) {
  const app = new Hono()

  app.get('/', async (c) => {
    try {
      const res = await fetch(`${config.ollama.url}/api/tags`)
      const data: any = await res.json()
      const models = (data.models || []).map((m: any) => m.name)
      return c.json({ status: 'ok', ollama: true, models })
    } catch {
      return c.json({ status: 'degraded', ollama: false, models: [] })
    }
  })

  return app
}
