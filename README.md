# 🏎️ AcceleRAG

**Acceleracers Knowledge Base** — a RAG-powered chatbot for the Hot Wheels Acceleracers universe.

Ask questions about characters, realms, accelechargers, drivers, and teams. The system scrapes the [Acceleracers Fandom Wiki](https://acceleracers.fandom.com), indexes it into a local vector store, and answers with context retrieved from the corpus + an LLM.

## Architecture

```
┌──────────┐     ┌──────────────────────────────────────┐
│  Client  │     │            Hono Server                │
│ (React ) │────>│  POST /api/chat  → SSE stream         │
│          │     │  POST /api/query → JSON               │
│          │     │  GET  /api/health                      │
└──────────┘     │                                        │
                 │  ┌────────────────────────────────┐    │
                 │  │   Application (RAGService)      │    │
                 │  │   orchestrates use cases        │    │
                 │  └──────────┬─────────────────────┘    │
                 │             │                           │
                 │  ┌──────────▼─────────────────────┐    │
                 │  │         Domain                   │    │
                 │  │  Entities · Use Cases · Ports    │    │
                 │  └──────────┬─────────────────────┘    │
                 │             │                           │
                 │  ┌──────────▼─────────────────────┐    │
                 │  │       Infrastructure             │    │
                 │  │  Ollama · Vectra · Fandom        │    │
                 │  └────────────────────────────────┘    │
                 └──────────────────────────────────────────┘
```

**Clean Architecture layers:**
- `src/domain/` — Entities, repository interfaces, use cases (zero external deps)
- `src/application/` — Service orchestration + config ports
- `src/infrastructure/` — Adapters: Ollama (embedding + LLM), Vectra (vector store), Fandom (scraper)
- `src/presentation/` — CLI REPL + Hono HTTP server with SSE streaming

**RAG pipeline:**
1. Scrape Fandom wiki → `data/corpus.json`
2. Semantic chunking (paragraph-aware, not fixed-size)
3. Embed chunks via Ollama `nomic-embed-text` → store in Vectra `LocalIndex`
4. Hybrid search (dense vector + BM25) for retrieval
5. Generate answer via Ollama `llama3.1:8b` with retrieved context

## Quick Start

### Prerequisites

- [Node.js](https://nodejs.org/) 22+
- [Ollama](https://ollama.ai/) running locally with models:
  ```bash
  ollama pull llama3.1:8b
  ollama pull nomic-embed-text
  ```

### Server

```bash
# Install & run
npm install
npm run dev        # starts HTTP server on :3000

# Or use CLI mode:
npm run cli        # interactive REPL
```

### Client

```bash
cd client
npm install
npm run dev        # starts Vite dev server on :5173
```

Open `http://localhost:5173` and start chatting.

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
{ "message": "Who is Vert Wheeler?" }
```
Returns SSE events:
```
event: token
data: {"token":"Vert"}

event: token
data: {"token":" Wheeler"}

event: done
data: {"answer":"Vert Wheeler is...","sources":[{"title":"Vert Wheeler","url":"..."}]}
```

### POST `/api/query` — Non-streaming JSON

```json
{ "message": "Who is Vert Wheeler?" }
// Response: { "text": "Vert Wheeler is...", "sources": [{"title":"...","url":"..."}] }
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
| Client | React 19, Vite, Tailwind CSS v4 |
| LLM | Ollama (llama3.1:8b) |
| Embeddings | Ollama (nomic-embed-text) |
| Vector Store | Vectra (local, with BM25 hybrid search) |
| Scraping | Cheerio, Fandom API |

## License

MIT
