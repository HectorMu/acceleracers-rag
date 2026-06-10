# 🏎️ AcceleRAG

**Acceleracers Knowledge Base** — a RAG-powered chatbot for the Hot Wheels Acceleracers universe.

Ask questions about characters, realms, accelechargers, drivers, and teams. The system scrapes the [Acceleracers Fandom Wiki](https://acceleracers.fandom.com), indexes it into a local vector store, and answers with context retrieved from the corpus + an LLM.

**Features:**
- 🔎 Hybrid search (dense vectors + BM25) with MMR diversity reranking
- 💬 Chat history sidebar with localStorage persistence
- 🧠 Conversation context sent to the LLM across turns
- 📝 Markdown rendering for responses
- 🚦 Guardrails (rate limiting, max length)
- 🟢 Connection status indicator + periodic health checks
- 🔔 Toast notifications for transient errors (rate limits, validation)
- ⚠️ Inline error bubbles for server/network failures
- 🔗 Source preview popover on hover

### Demo

https://github.com/user-attachments/assets/76044fc0-5ada-4229-8b21-9ffdfab52612


## Architecture

```
┌──────────────────┐     ┌──────────────────────────────────────────┐
│   React Client   │     │            Hono Server                    │
│  Tailwind CSS v4 │────>│  POST /api/chat  → SSE stream             │
│  react-markdown  │     │  POST /api/query → JSON                   │
│  lucide-react    │     │  GET  /api/health                          │
│                  │     │  Guardrails (rate-limit, max length)       │
└──────────────────┘     │                                            │
                         │  ┌────────────────────────────────────┐    │
                         │  │   Application (RAGService)          │    │
                         │  │   orchestrates use cases            │    │
                         │  └──────────┬─────────────────────────┘    │
                         │             │                               │
                         │  ┌──────────▼─────────────────────────┐    │
                         │  │         Domain                       │    │
                         │  │  Entities · Use Cases · Ports        │    │
                         │  │  MMR reranking · Conversation hist.  │    │
                         │  └──────────┬─────────────────────────┘    │
                         │             │                               │
                         │  ┌──────────▼─────────────────────────┐    │
                         │  │       Infrastructure                 │    │
                         │  │  Ollama · Vectra · MiniSearch (BM25) │    │
                         │  │  Fandom scraper · Cheerio            │    │
                         │  └────────────────────────────────────┘    │
                         └──────────────────────────────────────────────┘
```

**Clean Architecture layers:**
- `src/domain/` — Entities, repository interfaces, use cases (zero external deps)
- `src/application/` — Service orchestration + config ports
- `src/infrastructure/` — Adapters: Ollama (embedding + LLM), Vectra (vector store), MiniSearch (BM25), Fandom (scraper)
- `src/presentation/` — CLI REPL + Hono HTTP server with SSE streaming

**RAG pipeline:**
1. Scrape Fandom wiki → `data/corpus.json`
2. Semantic chunking (paragraph-aware, not fixed-size)
3. Embed chunks via Ollama `nomic-embed-text` → store in Vectra `LocalIndex`
4. Hybrid retrieval: dense vector search + BM25 (MiniSearch) with RRF fusion
5. MMR diversity reranking (Jaccard similarity, λ=0.6) → top K chunks
6. Generate answer via Ollama `llama3.1:8b` with retrieved context + conversation history

## Quick Start

### Prerequisites

- [Node.js](https://nodejs.org/) 22+
- [Ollama](https://ollama.ai/) running locally with models:
  ```bash
  ollama pull llama3.1:8b
  ollama pull nomic-embed-text
  ```

### Install

```bash
# Install server dependencies
npm install

# Install client dependencies (separate terminal or use full dev mode)
cd client && npm install && cd ..
```

### Run (server + client together)

```bash
npm run dev        # starts both server (:3000) and client (:5173) concurrently
```

Open `http://localhost:5173` and start chatting.

### Run individually

```bash
npm run dev:server   # Hono API server on http://localhost:3000
npm run dev:client   # Vite dev server on http://localhost:5173
```

### CLI mode (no browser needed)

```bash
npm run cli          # interactive REPL
```

### Docker

```bash
docker compose up  # starts Ollama + app
```

Environment variables (see `.env.example`):
| Variable | Default |
|---|---|
| `OLLAMA_URL` | `http://localhost:11434` |
| `CHAT_MODEL` | `llama3.1:8b` |
| `EMBED_MODEL` | `nomic-embed-text` |
| `PORT` | `3000` |
| `CHUNK_SIZE` | `800` |
| `CHUNK_OVERLAP` | `100` |
| `TOP_K` | `4` |

## API

### POST `/api/chat` — Streaming SSE

```json
{
  "message": "Who is Vert Wheeler?",
  "history": [{ "role": "user", "content": "..." }, { "role": "assistant", "content": "..." }]
}
```

`history` is optional — include previous messages for conversation context.

Returns SSE events:
```
event: token
data: {"token":"Vert"}

event: token
data: {"token":" Wheeler"}

event: done
data: {"answer":"Vert Wheeler is...","sources":[{"title":"Vert Wheeler","url":"...","excerpt":"..."}]}

event: error
data: {"error":"Generation failed"}
```

The `error` event is sent if the LLM fails mid-stream.

### POST `/api/query` — Non-streaming JSON

```json
{ "message": "Who is Vert Wheeler?" }
// Response: { "text": "Vert Wheeler is...", "sources": [{"title":"...","url":"...","excerpt":"..."}] }
```

### GET `/api/health`

```json
{ "status": "ok", "ollama": true, "models": ["llama3.1:8b", "nomic-embed-text"] }
```

## Data

- `data/corpus.json` — Scraped wiki pages (~306 pages, ~1.6MB)
- `data/index/` — Vectra vector index (~1,100 chunks, ~17MB)

Both are gitignored. Delete `data/corpus.json` to trigger a re-scrape.

## Tech Stack

| Layer | Technology |
|---|---|
| Server | Hono, TypeScript |
| Client | React 19, Vite, Tailwind CSS v4, lucide-react |
| LLM | Ollama (llama3.1:8b) |
| Embeddings | Ollama (nomic-embed-text) |
| Vector Store | Vectra (local) |
| BM25 Search | MiniSearch |
| Scraping | Cheerio, Fandom API |
| Rendering | react-markdown, remark-gfm |

## License

MIT
