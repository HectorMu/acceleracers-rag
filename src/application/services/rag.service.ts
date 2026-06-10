import type { AppConfig } from '../ports/config.js'
import type { CorpusRepository } from '../../domain/repositories/corpus-repository.js'
import type { IndexRepository } from '../../domain/repositories/index-repository.js'
import type { EmbeddingService } from '../../domain/repositories/embedding-service.js'
import type { LLMService } from '../../domain/repositories/llm-service.js'
import type { WikiScraper } from '../../domain/repositories/wiki-scraper.js'
import { ScrapeWikiUseCase } from '../../domain/use-cases/scrape-wiki.js'
import { IndexCorpusUseCase } from '../../domain/use-cases/index-corpus.js'
import { AnswerQuestionUseCase } from '../../domain/use-cases/answer-question.js'
import type { Query, Answer } from '../../domain/entities/query.js'

export class RAGService {
  private scrapeWiki: ScrapeWikiUseCase
  private indexCorpus: IndexCorpusUseCase
  private answerQuestion: AnswerQuestionUseCase

  constructor(
    config: AppConfig,
    corpusRepo: CorpusRepository,
    indexRepo: IndexRepository,
    embedder: EmbeddingService,
    llm: LLMService,
    scraper: WikiScraper
  ) {
    this.scrapeWiki = new ScrapeWikiUseCase(corpusRepo, scraper)
    this.indexCorpus = new IndexCorpusUseCase(
      corpusRepo, indexRepo, embedder,
      config.rag.chunkSize, config.rag.chunkOverlap
    )
    this.answerQuestion = new AnswerQuestionUseCase(
      indexRepo, embedder, llm, config.rag.topK
    )
  }

  async initialize(): Promise<void> {
    await this.scrapeWiki.execute()
    await this.indexCorpus.execute()
  }

  async answer(query: Query): Promise<Answer> {
    return this.answerQuestion.execute(query)
  }

  streamAnswer(query: Query): AsyncIterable<string> {
    return this.answerQuestion.stream(query)
  }
}
