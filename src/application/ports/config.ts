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
  ollama: {
    url: string
    chatModel: string
    embedModel: string
  }
  rag: {
    chunkSize: number
    chunkOverlap: number
    topK: number
  }
  server: {
    port: number
  }
}
