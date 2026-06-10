import type { Query, Answer } from '../entities/query.js'
import type { IndexRepository } from '../repositories/index-repository.js'
import type { EmbeddingService } from '../repositories/embedding-service.js'
import type { LLMService } from '../repositories/llm-service.js'

const SYSTEM_PROMPT = `You are an expert on the Hot Wheels Acceleracers universe.
Answer ONLY using the context below. If the answer isn't there, say you don't have that information.
Answer in the same language the user used.`

export class AnswerQuestionUseCase {
  constructor(
    private readonly indexRepo: IndexRepository,
    private readonly embedder: EmbeddingService,
    private readonly llm: LLMService,
    private readonly topK: number = 4
  ) {}

  async execute(query: Query): Promise<Answer> {
    const queryVector = await this.embedder.embed(query.text)
    const results = await this.indexRepo.querySimilar(queryVector, this.topK)

    const context = results.map(r => r.chunk.text).join('\n\n---\n\n')
    const seen = new Set<string>()
    const sources = results
      .map(r => ({ title: r.chunk.source, url: r.chunk.url }))
      .filter(s => { const k = s.title; return seen.has(k) ? false : (seen.add(k), true) })

    const prompt = `${SYSTEM_PROMPT}\n\nCONTEXT:\n${context}\n\nQUESTION: ${query.text}\n\nANSWER:`

    let text = ''
    for await (const token of this.llm.generate(prompt)) {
      text += token
    }

    return { text, sources }
  }

  async *stream(query: Query): AsyncIterable<string> {
    const queryVector = await this.embedder.embed(query.text)
    const results = await this.indexRepo.querySimilar(queryVector, this.topK)

    const context = results.map(r => r.chunk.text).join('\n\n---\n\n')
    const seen = new Set<string>()
    const sources = results
      .map(r => ({ title: r.chunk.source, url: r.chunk.url }))
      .filter(s => { const k = s.title; return seen.has(k) ? false : (seen.add(k), true) })

    const prompt = `${SYSTEM_PROMPT}\n\nCONTEXT:\n${context}\n\nQUESTION: ${query.text}\n\nANSWER:`

    for await (const token of this.llm.generate(prompt)) {
      yield token
    }

    yield `||SOURCES||${JSON.stringify(sources)}`
  }
}
