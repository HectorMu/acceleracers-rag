export type Provider = 'groq' | 'ollama'

export interface ProviderConfig {
  provider: Provider
  model: string
  apiKey?: string
  baseUrl?: string
}

export interface AppConfig {
  wiki: {
    api: string
    base: string
    userAgent: string
    delay: number
  }
  paths: {
    corpus: string
    index: string
    data: string
  }
  chat: ProviderConfig
  embedding: ProviderConfig
  rag: {
    chunkSize: number
    chunkOverlap: number
    topK: number
  }
  server: {
    port: number
  }
}
