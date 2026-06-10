import { LocalIndex } from 'vectra'
import path from 'path'
import type { Chunk } from '../../domain/entities/chunk.js'
import type { IndexRepository } from '../../domain/repositories/index-repository.js'

export class VectraIndexRepository implements IndexRepository {
  private index: LocalIndex

  constructor(indexPath: string) {
    this.index = new LocalIndex(path.join(indexPath))
  }

  async exists(): Promise<boolean> {
    return this.index.isIndexCreated()
  }

  async create(): Promise<void> {
    await this.index.createIndex()
  }

  async clear(): Promise<void> {
    if (await this.index.isIndexCreated()) {
      await this.index.deleteIndex()
    }
  }

  async upsertChunk(chunk: Chunk, vector: number[]): Promise<void> {
    await this.index.insertItem({
      vector,
      metadata: { text: chunk.text, source: chunk.source, url: chunk.url },
    })
  }

  async querySimilar(vector: number[], topK: number): Promise<{ chunk: Chunk; score: number }[]> {
    // Query more items, sort by score descending, then take topK
    const results = await this.index.queryItems(vector, '', topK * 5, undefined, false)
    return results
      .sort((a, b) => b.score - a.score)
      .slice(0, topK)
      .map(r => ({
        chunk: {
          text: r.item.metadata.text as string,
          source: r.item.metadata.source as string,
          url: r.item.metadata.url as string,
        },
        score: r.score,
      }))
  }
}
