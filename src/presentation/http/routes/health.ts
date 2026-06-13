import { Hono } from 'hono'
import type { AppConfig } from '../../../application/ports/config.js'

async function checkGroqHealth(config: AppConfig) {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 5000)
  try {
    const res = await fetch('https://api.groq.com/openai/v1/models', {
      headers: config.chat.apiKey ? { Authorization: `Bearer ${config.chat.apiKey}` } : {},
      signal: controller.signal,
    })
    clearTimeout(timeout)
    if (!res.ok) throw new Error(`Groq returned ${res.status}`)
    const data: any = await res.json()
    const models = (data.data || []).map((m: any) => m.id)
    return { status: 'ok', provider: 'groq', models } as const
  } catch {
    clearTimeout(timeout)
    return { status: 'degraded', provider: 'groq', models: [] } as const
  }
}

async function checkOllamaHealth(config: AppConfig) {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 5000)
  try {
    const res = await fetch(`${config.chat.baseUrl || 'http://localhost:11434'}/api/tags`, { signal: controller.signal })
    clearTimeout(timeout)
    const data: any = await res.json()
    const models = (data.models || []).map((m: any) => m.name)
    return { status: 'ok', provider: 'ollama', models } as const
  } catch {
    clearTimeout(timeout)
    return { status: 'degraded', provider: 'ollama', models: [] } as const
  }
}

export function healthRoute(config: AppConfig) {
  const app = new Hono()

  app.get('/', async (c) => {
    if (config.chat.provider === 'groq') {
      const result = await checkGroqHealth(config)
      return c.json(result)
    }
    const result = await checkOllamaHealth(config)
    return c.json(result)
  })

  return app
}
