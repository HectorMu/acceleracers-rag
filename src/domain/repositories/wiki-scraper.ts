import type { WikiPage } from '../entities/wiki-page.js'

export interface WikiScraper {
  getAllPageTitles(): Promise<string[]>
  scrapePage(title: string): Promise<WikiPage | null>
}
