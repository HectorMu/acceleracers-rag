import type { WikiPage } from '../entities/wiki-page.js'

export interface CorpusRepository {
  exists(): Promise<boolean>
  load(): Promise<WikiPage[]>
  save(pages: WikiPage[]): Promise<void>
}
