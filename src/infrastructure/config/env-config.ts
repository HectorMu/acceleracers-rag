import { readFileSync, existsSync } from 'fs'
import type { AppConfig, Provider } from '../../application/ports/config.js'

function detectChatProvider(): Provider {
  if (process.env.CHAT_PROVIDER) return process.env.CHAT_PROVIDER as Provider
  if (process.env.OLLAMA_URL) return 'ollama'
  return 'groq'
}

function detectEmbedProvider(): Provider {
  if (process.env.EMBEDDING_PROVIDER) return process.env.EMBEDDING_PROVIDER as Provider
  return 'ollama'
}

function loadProviders() {
  const chatProvider = detectChatProvider()
  const embedProvider = detectEmbedProvider()

  return {
    chat: {
      provider: chatProvider,
      model: process.env.CHAT_MODEL || (chatProvider === 'ollama' ? 'llama3.1:8b' : 'llama-3.1-8b-instant'),
      apiKey: process.env.GROQ_API_KEY,
      baseUrl: chatProvider === 'ollama'
        ? (process.env.OLLAMA_URL || 'http://localhost:11434')
        : process.env.GROQ_BASE_URL,
    },
    embedding: {
      provider: embedProvider,
      model: process.env.EMBEDDING_MODEL || (embedProvider === 'ollama' ? 'nomic-embed-text' : 'nomic-embed-text-v1.5'),
      apiKey: process.env.GROQ_API_KEY,
      baseUrl: embedProvider === 'ollama'
        ? (process.env.OLLAMA_URL || 'http://localhost:11434')
        : process.env.GROQ_BASE_URL,
    },
  }
}

export function loadConfig(): AppConfig {
  if (existsSync('.env')) {
    const env = readFileSync('.env', 'utf-8')
    for (const line of env.split('\n')) {
      const trimmed = line.trim()
      if (!trimmed || trimmed.startsWith('#')) continue
      const eq = trimmed.indexOf('=')
      if (eq === -1) continue
      const key = trimmed.slice(0, eq).trim()
      const val = trimmed.slice(eq + 1).trim()
      process.env[key] = val
    }
  }

  return {
    wiki: {
      api: process.env.WIKI_API || 'https://acceleracers.fandom.com/api.php',
      base: process.env.WIKI_BASE || 'https://acceleracers.fandom.com',
      userAgent: 'AcceleRAG/1.0 (educational RAG project)',
      delay: parseInt(process.env.WIKI_DELAY || '500', 10),
    },
    paths: {
      corpus: process.env.CORPUS_PATH || './data/corpus.json',
      index: process.env.INDEX_PATH || './data/index',
      data: './data',
    },
    ...loadProviders(),
    rag: {
      chunkSize: parseInt(process.env.CHUNK_SIZE || '800', 10),
      chunkOverlap: parseInt(process.env.CHUNK_OVERLAP || '100', 10),
      topK: parseInt(process.env.TOP_K || '4', 10),
    },
    server: {
      port: parseInt(process.env.PORT || '3000', 10),
    },
  }
}
