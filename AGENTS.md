# AcceleRAG — Agent Context

## Architecture
Clean Architecture with 4 layers:
- `src/domain/` — Entities, use cases, repository interfaces
- `src/application/` — RAGService orchestration, config port
- `src/infrastructure/` — Adapters: Ollama, Vectra, Fandom scraper
- `src/presentation/` — CLI repl, Hono HTTP server with SSE streaming

## Key Commands
- `npm run dev` — Start HTTP server (hot reload via tsx)
- `npm run cli` — Start CLI REPL
- `npm run build` — Compile TypeScript
- `npm run typecheck` — Type-check without emitting

## Entry Points
- `src/index.ts` — Main entry, `--mode cli` for REPL, `--mode server` (default) for HTTP
- `client/src/main.tsx` — React client entry

## RAG Pipeline
1. FandomScraper → FileCorpusRepository (corpus.json)
2. Semantic chunker → OllamaEmbedder → VectraIndexRepository
3. Hybrid search (dense + BM25) → OllamaLLM (streaming)

## Models
- Chat: llama3.1:8b (via Ollama)
- Embedding: nomic-embed-text (via Ollama)

## Config
All via env vars (see .env.example). Loaded in src/infrastructure/config/env-config.ts

## Data Files
- data/corpus.json — Scraped wiki corpus (gitignored)
- data/index/ — Vectra vector index (gitignored)
