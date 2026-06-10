import { Hono } from 'hono'
import { streamSSE } from 'hono/streaming'
import type { RAGService } from '../../../application/services/rag.service.js'

export function chatRoute(rag: RAGService) {
  const app = new Hono()

  app.post('/', async (c) => {
    let message: string
    try {
      const body = await c.req.json()
      message = body.message
    } catch {
      return c.json({ error: 'invalid JSON body' }, 400)
    }
    if (!message || typeof message !== 'string') {
      return c.json({ error: 'message is required' }, 400)
    }

    return streamSSE(c, async (stream) => {
      const gen = rag.streamAnswer({ text: message })
      let fullAnswer = ''

      let gotDone = false
      for await (const token of gen) {
        if (token.startsWith('||SOURCES||')) {
          let sources: { title: string; url: string; excerpt?: string }[] = []
          try {
            sources = JSON.parse(token.slice(11))
          } catch {
            sources = []
          }
          await stream.writeSSE({
            event: 'done',
            data: JSON.stringify({ answer: fullAnswer, sources }),
          })
          gotDone = true
        } else {
          fullAnswer += token
          await stream.writeSSE({
            event: 'token',
            data: JSON.stringify({ token }),
          })
        }
      }

      if (!gotDone) {
        await stream.writeSSE({
          event: 'done',
          data: JSON.stringify({ answer: fullAnswer, sources: [] }),
        })
      }
    })
  })

  return app
}
