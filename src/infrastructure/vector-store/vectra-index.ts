import { LocalIndex } from 'vectra'
import MiniSearch from 'minisearch'
import path from 'path'
import { existsSync } from 'fs'
import type { Chunk } from '../../domain/entities/chunk.js'
import type { IndexRepository } from '../../domain/repositories/index-repository.js'

export class VectraIndexRepository implements IndexRepository {
  private index: LocalIndex
  private miniSearch: MiniSearch
  private nextId = 0

  constructor(indexPath: string) {
    this.index = new LocalIndex(path.join(indexPath))
    this.miniSearch = new MiniSearch({
      fields: ['text'],
      storeFields: ['text', 'source', 'url'],
      idField: 'id',
    })
  }

  async exists(): Promise<boolean> {
    return this.index.isIndexCreated()
  }

  async create(): Promise<void> {
    await this.index.createIndex()
    this.resetMiniSearch()
  }

  async clear(): Promise<void> {
    if (await this.index.isIndexCreated()) {
      await this.index.deleteIndex()
    }
    this.resetMiniSearch()
  }

  private resetMiniSearch() {
    this.miniSearch = new MiniSearch({
      fields: ['text'],
      storeFields: ['text', 'source', 'url'],
      idField: 'id',
    })
    this.nextId = 0
  }

  async upsertChunk(chunk: Chunk, vector: number[]): Promise<void> {
    await this.index.insertItem({
      vector,
      metadata: { text: chunk.text, source: chunk.source, url: chunk.url },
    })
    const id = String(this.nextId++)
    this.miniSearch.add({ id, text: chunk.text, source: chunk.source, url: chunk.url })
  }

  async querySimilar(vector: number[], topK: number, query?: string): Promise<{ chunk: Chunk; score: number }[]> {
    const denseResults = await this.index.queryItems(vector, '', topK * 5, undefined, false)

    let bm25Results: { id: string; score: number }[] = []
    if (query && query.trim()) {
      bm25Results = this.miniSearch.search(query, { fuzzy: 0.0, prefix: true, boost: { text: 2 } })
    }

    const denseMap = new Map<string, number>()
    denseResults.forEach((r, i) => {
      const key = r.item.metadata.text as string
      denseMap.set(key, denseResults.length - i)
    })

    const bm25Map = new Map<string, number>()
    bm25Results.forEach((r, i) => {
      bm25Map.set(r.id, bm25Results.length - i)
    })

    const seenKeys = new Set<string>()
    const fused: { chunk: Chunk; score: number }[] = []

    const K = 60
    for (const r of denseResults) {
      const key = r.item.metadata.text as string
      if (seenKeys.has(key)) continue
      seenKeys.add(key)
      const denseRank = denseMap.get(key) || 0
      const bm25Rank = bm25Map.get(key) || 0
      const rrfScore = (denseRank > 0 ? 1 / (K + (denseResults.length - denseRank + 1)) : 0) +
                       (bm25Rank > 0 ? 1 / (K + (bm25Results.length - bm25Rank + 1)) : 0)
      fused.push({
        chunk: {
          text: r.item.metadata.text as string,
          source: r.item.metadata.source as string,
          url: r.item.metadata.url as string,
        },
        score: rrfScore,
      })
    }

    if (bm25Results.length > 0) {
      for (const r of bm25Results) {
        if (!r.id) continue
        const stored = this.miniSearch.getStoredFields(r.id) as Record<string, string> | undefined
        if (!stored || seenKeys.has(stored.text)) continue
        seenKeys.add(stored.text)
        const bm25Rank = bm25Map.get(r.id) || 0
        const rrfScore = 1 / (K + (bm25Results.length - bm25Rank + 1))
        fused.push({
          chunk: { text: stored.text, source: stored.source, url: stored.url },
          score: rrfScore,
        })
      }
    }

    return fused.sort((a, b) => b.score - a.score).slice(0, topK)
  }
}
