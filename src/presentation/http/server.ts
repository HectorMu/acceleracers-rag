import { serve } from '@hono/node-server'
import { Hono } from 'hono'
import { cors } from 'hono/cors'
import type { RAGService } from '../../application/services/rag.service.js'
import type { AppConfig } from '../../application/ports/config.js'
import { chatRoute } from './routes/chat.js'
import { queryRoute } from './routes/query.js'
import { healthRoute } from './routes/health.js'
import { errorHandler } from './middleware/error-handler.js'

export function createServer(rag: RAGService, config: AppConfig) {
  const app = new Hono()

  app.use('*', cors())
  app.onError(errorHandler)

  app.route('/api/chat', chatRoute(rag))
  app.route('/api/query', queryRoute(rag))
  app.route('/api/health', healthRoute(config))

  const port = config.server.port
  serve({ fetch: app.fetch, port }, () => {
    console.log(`🏎️  AcceleRAG server running on http://localhost:${port}`)
    console.log(`   POST /api/chat  — streaming SSE`)
    console.log(`   POST /api/query — JSON`)
    console.log(`   GET  /api/health`)
  })

  return app
}
