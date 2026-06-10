import type { CorpusRepository } from '../repositories/corpus-repository.js'
import type { WikiScraper } from '../repositories/wiki-scraper.js'

export class ScrapeWikiUseCase {
  constructor(
    private readonly corpusRepo: CorpusRepository,
    private readonly scraper: WikiScraper
  ) {}

  async execute(): Promise<void> {
    if (await this.corpusRepo.exists()) {
      console.log('💾  corpus.json already exists, skipping scrape...')
      return
    }

    const titles = await this.scraper.getAllPageTitles()
    console.log(`📋  Pages to scrape: ${titles.length}\n`)

    const pages: import('../entities/wiki-page.js').WikiPage[] = []
    for (let i = 0; i < titles.length; i++) {
      process.stdout.write(`\r   [${i + 1}/${titles.length}] ${titles[i].substring(0, 45).padEnd(45)}`)
      const page = await this.scraper.scrapePage(titles[i])
      if (page) pages.push(page)
    }

    await this.corpusRepo.save(pages)
    console.log(`\n✅  Scraping done: ${pages.length} pages saved`)
  }
}
