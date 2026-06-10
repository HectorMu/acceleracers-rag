import type { WikiPage } from '../entities/wiki-page.js'
import type { Chunk } from '../entities/chunk.js'
import type { CorpusRepository } from '../repositories/corpus-repository.js'
import type { IndexRepository } from '../repositories/index-repository.js'
import type { EmbeddingService } from '../repositories/embedding-service.js'

function splitIntoChunks(page: WikiPage, maxChunkSize: number, overlap: number): Chunk[] {
  const chunks: Chunk[] = []
  let text = page.text.replace(/<[^>]*>/g, '').trim()

  // Split by double newlines (paragraphs) first
  const paragraphs = text.split(/\n\s*\n/).filter(p => p.trim().length > 0)

  let current: string[] = []
  let currentLen = 0

  for (const para of paragraphs) {
    const clean = para.replace(/\s+/g, ' ').trim()
    if (!clean) continue

    // If a single paragraph exceeds maxChunkSize, split it by sentences
    if (clean.length > maxChunkSize) {
      if (current.length > 0) {
        chunks.push({ text: current.join('\n\n'), source: page.title, url: page.url })
        current = []
        currentLen = 0
      }
      // Split large paragraph by sentence boundaries
      const sentences = clean.match(/[^.!?]+[.!?]+/g) || [clean]
      let senBuf: string[] = []
      let senLen = 0
      for (const sent of sentences) {
        if (senLen + sent.length > maxChunkSize && senBuf.length > 0) {
          chunks.push({ text: senBuf.join(' '), source: page.title, url: page.url })
          senBuf = []
          senLen = 0
        }
        senBuf.push(sent)
        senLen += sent.length
      }
      if (senBuf.length > 0) {
        chunks.push({ text: senBuf.join(' '), source: page.title, url: page.url })
      }
      continue
    }

    // Normal paragraph: add to current buffer
    if (currentLen + clean.length > maxChunkSize && current.length > 0) {
      chunks.push({ text: current.join('\n\n'), source: page.title, url: page.url })
      // Keep overlap: retain last few paragraphs
      const overlapText = current.join('\n\n')
      const overlapStart = Math.max(0, overlapText.length - overlap)
      current = overlapText.slice(overlapStart) ? [overlapText.slice(overlapStart)] : []
      currentLen = current.reduce((a, c) => a + c.length, 0)
    }

    current.push(clean)
    currentLen += clean.length
  }

  if (current.length > 0) {
    chunks.push({ text: current.join('\n\n'), source: page.title, url: page.url })
  }

  return chunks.filter(c => c.text.length > 50)
}

export class IndexCorpusUseCase {
  constructor(
    private readonly corpusRepo: CorpusRepository,
    private readonly indexRepo: IndexRepository,
    private readonly embedder: EmbeddingService,
    private readonly chunkSize: number = 800,
    private readonly chunkOverlap: number = 100
  ) {}

  async execute(): Promise<void> {
    if (await this.indexRepo.exists()) {
      await this.indexRepo.clear()
      console.log('🗑️  Dropped previous index')
    }

    await this.indexRepo.create()
    const pages = await this.corpusRepo.load()
    console.log(`📦  Indexing ${pages.length} pages...\n`)

    let total = 0
    for (let i = 0; i < pages.length; i++) {
      const chunks = splitIntoChunks(pages[i], this.chunkSize, this.chunkOverlap)
      process.stdout.write(`\r   Page ${i + 1}/${pages.length} — ${total} chunks indexed`)

      for (const chunk of chunks) {
        const vector = await this.embedder.embed(chunk.text)
        await this.indexRepo.upsertChunk(chunk, vector)
        total++
      }
    }

    console.log(`\n✅  Indexing complete — ${total} chunks total`)
  }
}
