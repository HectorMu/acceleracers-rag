import { Hono } from 'hono'
import type { RAGService } from '../../../application/services/rag.service.js'

export function queryRoute(rag: RAGService) {
  const app = new Hono()

  app.post('/', async (c) => {
    const { message } = await c.req.json()
    if (!message || typeof message !== 'string') {
      return c.json({ error: 'message is required' }, 400)
    }

    const answer = await rag.answer({ text: message })
    return c.json(answer)
  })

  return app
}
