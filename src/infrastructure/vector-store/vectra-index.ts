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

  async upsertChunk(_chunk: Chunk, vector: number[]): Promise<void> {
    await this.index.insertItem({
      vector,
      metadata: { text: _chunk.text, source: _chunk.source, url: _chunk.url },
    })
  }

  async querySimilar(vector: number[], topK: number): Promise<{ chunk: Chunk; score: number }[]> {
    // Hybrid search: dense vector + BM25 (pass query text for keyword matching)
    // Query more items for reranking
    const results = await this.index.queryItems(vector, '', topK * 5, undefined, true)
    return results
      .slice(0, topK * 3)
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
