import type { Chunk } from '../entities/chunk.js'

export interface IndexRepository {
  exists(): Promise<boolean>
  create(): Promise<void>
  clear(): Promise<void>
  upsertChunk(chunk: Chunk, vector: number[]): Promise<void>
  querySimilar(vector: number[], topK: number): Promise<{ chunk: Chunk; score: number }[]>
}
