import { loadConfig } from './infrastructure/config/env-config.js'
import type { LLMService } from './domain/repositories/llm-service.js'
import type { EmbeddingService } from './domain/repositories/embedding-service.js'
import type { AppConfig } from './application/ports/config.js'
import { FandomScraper } from './infrastructure/scraping/fandom-scraper.js'
import { FileCorpusRepository } from './infrastructure/scraping/corpus-repository.js'
import { VectraIndexRepository } from './infrastructure/vector-store/vectra-index.js'
import { AILlmAdapter } from './infrastructure/llm/ai-llm.js'
import { AIEmbedder } from './infrastructure/embedding/ai-embedder.js'
import { RAGService } from './application/services/rag.service.js'
import { startCLI } from './presentation/cli/repl.js'
import { createServer } from './presentation/http/server.js'

function normalizeOllamaUrl(baseUrl: string | undefined): string | undefined {
  if (!baseUrl) return undefined
  const cleaned = baseUrl.replace(/\/+$/, '')
  return cleaned.endsWith('/api') ? cleaned : `${cleaned}/api`
}

async function createLLM(config: AppConfig): Promise<LLMService> {
  switch (config.chat.provider) {
    case 'groq': {
      const { createGroq } = await import('@ai-sdk/groq')
      const groq = createGroq({ apiKey: config.chat.apiKey })
      return new AILlmAdapter(groq(config.chat.model))
    }
    case 'ollama': {
      const { createOllama } = await import('ollama-ai-provider-v2')
      const ollama = createOllama({ baseURL: normalizeOllamaUrl(config.chat.baseUrl) })
      return new AILlmAdapter(ollama(config.chat.model))
    }
    default:
      throw new Error(`Unknown chat provider: ${config.chat.provider}`)
  }
}

async function createEmbedder(config: AppConfig): Promise<EmbeddingService> {
  switch (config.embedding.provider) {
    case 'groq': {
      const { createOpenAICompatible } = await import('@ai-sdk/openai-compatible')
      const provider = createOpenAICompatible({
        name: 'groq',
        baseURL: config.embedding.baseUrl || 'https://api.groq.com/openai/v1',
        headers: config.embedding.apiKey
          ? { Authorization: `Bearer ${config.embedding.apiKey}` }
          : undefined,
      })
      return new AIEmbedder(provider.textEmbeddingModel(config.embedding.model))
    }
    case 'ollama': {
      const { createOllama } = await import('ollama-ai-provider-v2')
      const ollama = createOllama({ baseURL: normalizeOllamaUrl(config.embedding.baseUrl) })
      return new AIEmbedder(ollama.textEmbeddingModel(config.embedding.model))
    }
    default:
      throw new Error(`Unknown embedding provider: ${config.embedding.provider}`)
  }
}

async function main() {
  const config = loadConfig()

  const corpusRepo = new FileCorpusRepository(config.paths.corpus)
  const indexRepo = new VectraIndexRepository(config.paths.index)
  const embedder = await createEmbedder(config)
  const llm = await createLLM(config)
  const scraper = new FandomScraper(
    config.wiki.api,
    config.wiki.base,
    config.wiki.userAgent,
    config.wiki.delay
  )

  const rag = new RAGService(config, corpusRepo, indexRepo, embedder, llm, scraper)

  const modeIdx = process.argv.indexOf('--mode')
  const mode = modeIdx !== -1 && process.argv[modeIdx + 1] ? process.argv[modeIdx + 1] : 'server'

  if (mode === 'cli') {
    await rag.initialize()
    startCLI(rag, config)
  } else {
    await rag.initialize()
    createServer(rag, config)
  }
}

main().catch((err) => {
  console.error('\n❌ Error:', err instanceof Error ? err.message : String(err))
  process.exit(1)
})
