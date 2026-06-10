import { loadConfig } from './infrastructure/config/env-config.js'
import { FandomScraper } from './infrastructure/scraping/fandom-scraper.js'
import { FileCorpusRepository } from './infrastructure/scraping/corpus-repository.js'
import { VectraIndexRepository } from './infrastructure/vector-store/vectra-index.js'
import { OllamaEmbedder } from './infrastructure/embedding/ollama-embedder.js'
import { OllamaLLM } from './infrastructure/llm/ollama-llm.js'
import { RAGService } from './application/services/rag.service.js'
import { startCLI } from './presentation/cli/repl.js'
import { createServer } from './presentation/http/server.js'

async function main() {
  const config = loadConfig()

  const corpusRepo = new FileCorpusRepository(config.paths.corpus)
  const indexRepo = new VectraIndexRepository(config.paths.index)
  const embedder = new OllamaEmbedder(config.ollama.url, config.ollama.embedModel)
  const llm = new OllamaLLM(config.ollama.url, config.ollama.chatModel)
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
