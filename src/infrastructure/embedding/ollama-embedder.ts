import type { EmbeddingService } from '../../domain/repositories/embedding-service.js'

export class OllamaEmbedder implements EmbeddingService {
  constructor(
    private readonly url: string,
    private readonly model: string
  ) {}

  async embed(text: string): Promise<number[]> {
    const res = await fetch(`${this.url}/api/embeddings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ model: this.model, prompt: text }),
    })
    const data: any = await res.json()
    if (!data.embedding) throw new Error(`Embedding failed: ${JSON.stringify(data)}`)
    return data.embedding
  }
}
