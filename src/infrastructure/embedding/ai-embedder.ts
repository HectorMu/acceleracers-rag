import { embed } from 'ai'
import type { EmbeddingModel } from 'ai'
import type { EmbeddingService } from '../../domain/repositories/embedding-service.js'

export class AIEmbedder implements EmbeddingService {
  constructor(private readonly model: EmbeddingModel) {}

  async embed(text: string): Promise<number[]> {
    const { embedding } = await embed({
      model: this.model,
      value: text,
    })
    return embedding
  }
}
