import { writeFile, readFile, mkdir } from 'fs/promises'
import { existsSync } from 'fs'
import path from 'path'
import type { WikiPage } from '../../domain/entities/wiki-page.js'
import type { CorpusRepository } from '../../domain/repositories/corpus-repository.js'

interface Corpus { [title: string]: WikiPage }

export class FileCorpusRepository implements CorpusRepository {
  constructor(private readonly corpusPath: string) {}

  async exists(): Promise<boolean> {
    return existsSync(this.corpusPath)
  }

  async load(): Promise<WikiPage[]> {
    const raw = await readFile(this.corpusPath, 'utf-8')
    const corpus: Corpus = JSON.parse(raw)
    return Object.values(corpus)
  }

  async save(pages: WikiPage[]): Promise<void> {
    const dir = path.dirname(this.corpusPath)
    if (!existsSync(dir)) await mkdir(dir, { recursive: true })
    const corpus: Corpus = {}
    for (const p of pages) corpus[p.title] = p
    await writeFile(this.corpusPath, JSON.stringify(corpus, null, 2), 'utf-8')
  }
}
