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

https://github.com/user-attachments/assets/58d4147a-1018-496c-b1b0-a0dd2f7f2ed3


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
                         │  │  Groq/Ollama · Vectra · MiniSearch  │    │
                         │  │  Fandom scraper · Vercel AI SDK     │    │
                         │  └────────────────────────────────────┘    │
                         └──────────────────────────────────────────────┘
```

**Clean Architecture layers:**
- `src/domain/` — Entities, repository interfaces, use cases (zero external deps)
- `src/application/` — Service orchestration + config ports
- `src/infrastructure/` — Adapters: Groq/Ollama (Vercel AI SDK), Vectra (vector store), MiniSearch (BM25), Fandom (scraper)
- `src/presentation/` — CLI REPL + Hono HTTP server with SSE streaming

**RAG pipeline:**
1. Scrape Fandom wiki → `data/corpus.json`
2. Semantic chunking (paragraph-aware, 1200 char chunks with 150 overlap)
3. Embed chunks via Ollama `nomic-embed-text` → store in Vectra `LocalIndex`
4. Hybrid retrieval: dense vector search + BM25 exact-match (MiniSearch) with RRF fusion
5. MMR diversity reranking (Jaccard similarity, λ=0.4) → top 6 chunks
6. Generate answer via Groq (or Ollama) with proper system role, retrieved context + conversation history

## Quick Start

### Prerequisites

- [Node.js](https://nodejs.org/) 22+
- [Groq](https://console.groq.com) API key (free tier) for chat, or [Ollama](https://ollama.ai/) running locally as alternative
- For embeddings: [Ollama](https://ollama.ai/) with `nomic-embed-text`:
  ```bash
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
| Variable | Default | Description |
|---|---|---|
| `CHAT_PROVIDER` | `groq` | `groq` or `ollama` |
| `CHAT_MODEL` | `llama-3.1-8b-instant` | Groq model; Ollama uses `llama3.1:8b` |
| `GROQ_API_KEY` | — | Required when `CHAT_PROVIDER=groq` |
| `EMBEDDING_PROVIDER` | `ollama` | `ollama` only (Groq has no embedding models) |
| `EMBEDDING_MODEL` | `nomic-embed-text` | Embedding model |
| `OLLAMA_URL` | `http://localhost:11434` | Base URL for Ollama |
| `CHUNK_SIZE` | `1200` | Characters per chunk |
| `CHUNK_OVERLAP` | `150` | Overlap between chunks |
| `TOP_K` | `6` | Chunks retrieved per query |
| `PORT` | `3000` | Server port |

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
{ "status": "ok", "chatProvider": "groq", "chatModel": "llama-3.1-8b-instant", "embeddingProvider": "ollama", "embeddingModel": "nomic-embed-text" }
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
| LLM | Groq (llama-3.1-8b-instant) or Ollama (llama3.1:8b) via Vercel AI SDK |
| Embeddings | Ollama (nomic-embed-text) via Vercel AI SDK |
| Vector Store | Vectra (local) |
| BM25 Search | MiniSearch (exact-match, no fuzzy) |
| Scraping | Cheerio, Fandom API |
| Rendering | react-markdown, remark-gfm |

## License

MIT
