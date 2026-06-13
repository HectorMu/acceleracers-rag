import * as cheerio from 'cheerio'
import type { WikiPage } from '../../domain/entities/wiki-page.js'
import type { WikiScraper } from '../../domain/repositories/wiki-scraper.js'

function sleep(ms: number) { return new Promise(r => setTimeout(r, ms)) }

export class FandomScraper implements WikiScraper {
  constructor(
    private readonly api: string,
    private readonly base: string,
    private readonly userAgent: string,
    private readonly delay: number
  ) {}

  private async fetch(params: Record<string, string>): Promise<any> {
    const url = new URL(this.api)
    url.search = new URLSearchParams({ ...params, format: 'json' }).toString()
    const res = await fetch(url.toString(), {
      headers: {
        'User-Agent': this.userAgent,
        'Accept': 'application/json',
        'Accept-Encoding': 'identity',
      },
    })
    const text = await res.text()
    try { return JSON.parse(text) }
    catch {
      console.error('\n❌ API returned non-JSON. First 300 chars:', text.slice(0, 300))
      throw new Error('Fandom API did not return JSON')
    }
  }

  async getAllPageTitles(): Promise<string[]> {
    const titles: string[] = []
    let apcontinue: string | undefined
    process.stdout.write('   Fetching page list...')
    do {
      const data = await this.fetch({
        action: 'query',
        list: 'allpages',
        aplimit: '500',
        apnamespace: '0',
        ...(apcontinue && { apcontinue }),
      })
      if (!data.query?.allpages) {
        throw new Error('Unexpected API response: ' + JSON.stringify(data).slice(0, 300))
      }
      titles.push(...data.query.allpages.map((p: any) => p.title))
      apcontinue = data.continue?.apcontinue
      process.stdout.write(`\r   Fetching page list... ${titles.length} found`)
      await sleep(this.delay)
    } while (apcontinue)
    console.log()
    return titles
  }

  async scrapePage(title: string): Promise<WikiPage | null> {
    const data = await this.fetch({ action: 'parse', page: title, prop: 'text' })
    if (data.error) return null
    const html: string = data.parse?.text?.['*']
    if (!html) return null

    const $ = cheerio.load(html)
    ;($('.navbox, .infobox, .toc, .mw-editsection, script, style, .noprint, sup, .reference, .reflist') as any).remove()
    const text = ($('body') as any)
      .text()
      .replace(/\n{3,}/g, '\n\n')
      .replace(/\t/g, ' ')
      .replace(/ {2,}/g, ' ')
      .trim()

    if (text.length < 50) return null
    return {
      title,
      text,
      url: `${this.base}/wiki/${encodeURIComponent(title.replace(/ /g, '_'))}`,
    }
  }
}
