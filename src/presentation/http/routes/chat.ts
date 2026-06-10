import { Hono } from 'hono'
import { streamSSE } from 'hono/streaming'
import type { RAGService } from '../../../application/services/rag.service.js'

export function chatRoute(rag: RAGService) {
  const app = new Hono()

  app.post('/', async (c) => {
    const { message } = await c.req.json()
    if (!message || typeof message !== 'string') {
      return c.json({ error: 'message is required' }, 400)
    }

    return streamSSE(c, async (stream) => {
      const gen = rag.streamAnswer({ text: message })
      let fullAnswer = ''

      for await (const token of gen) {
        if (token.startsWith('||SOURCES||')) {
          const sources = JSON.parse(token.slice(10))
          await stream.writeSSE({
            event: 'done',
            data: JSON.stringify({ answer: fullAnswer, sources }),
          })
        } else {
          fullAnswer += token
          await stream.writeSSE({
            event: 'token',
            data: JSON.stringify({ token }),
          })
        }
      }

      if (!fullAnswer) {
        await stream.writeSSE({
          event: 'done',
          data: JSON.stringify({ answer: '', sources: [] }),
        })
      }
    })
  })

  return app
}
