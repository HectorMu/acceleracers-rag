import type { Query, Answer } from '../entities/query.js'
import type { IndexRepository } from '../repositories/index-repository.js'
import type { EmbeddingService } from '../repositories/embedding-service.js'
import type { LLMService } from '../repositories/llm-service.js'
import type { Chunk } from '../entities/chunk.js'

const SYSTEM_PROMPT = `You are an expert on the Hot Wheels Acceleracers universe.
Answer ONLY using the provided context. If the answer isn't there, say you don't have that information.
Answer in the same language the user used. Use the conversation history for context.`

const HALLUCINATION_PROMPT = `You are a fact-checker. Your job is to check if each statement in the ANSWER is directly supported by the CONTEXT.
For each statement, determine if it is SUPPORTED or UNSUPPORTED.
Respond with ONLY a JSON array of objects: [{"statement": "...", "verdict": "SUPPORTED" | "UNSUPPORTED"}]

CONTEXT:
{context}

ANSWER:
{answer}

JSON:`

function mmrSelect(
  items: { chunk: Chunk; score: number }[],
  topK: number,
  lambda = 0.6,
): { chunk: Chunk; score: number }[] {
  if (items.length <= topK) return items

  const selected: typeof items = []
  const candidates = [...items]
  const embeddingCache = new Map<number, number[]>()

  while (selected.length < topK && candidates.length > 0) {
    let bestIdx = 0
    let bestScore = -Infinity

    for (let i = 0; i < candidates.length; i++) {
      const relevance = candidates[i].score

      let diversity = 0
      if (selected.length > 0) {
        const termsA = new Set(candidates[i].chunk.text.toLowerCase().split(/\s+/))
        let maxSim = 0
        for (const sel of selected) {
          const termsB = new Set(sel.chunk.text.toLowerCase().split(/\s+/))
          const intersection = new Set([...termsA].filter(x => termsB.has(x)))
          const union = new Set([...termsA, ...termsB])
          const jaccard = intersection.size / union.size
          maxSim = Math.max(maxSim, jaccard)
        }
        diversity = 1 - maxSim
      } else {
        diversity = 1
      }

      const mmr = lambda * relevance + (1 - lambda) * diversity
      if (mmr > bestScore) {
        bestScore = mmr
        bestIdx = i
      }
    }

    selected.push(candidates[bestIdx])
    candidates.splice(bestIdx, 1)
  }

  return selected
}

export class AnswerQuestionUseCase {
  constructor(
    private readonly indexRepo: IndexRepository,
    private readonly embedder: EmbeddingService,
    private readonly llm: LLMService,
    private readonly topK: number = 4,
  ) {}

  private deduplicateSources(results: { chunk: Chunk }[]) {
    const seen = new Set<string>()
    return results
      .map(r => ({ title: r.chunk.source, url: r.chunk.url, excerpt: r.chunk.text.slice(0, 200) }))
      .filter(s => { const k = s.title; return seen.has(k) ? false : (seen.add(k), true) })
  }

  private buildPrompt(query: Query, context: string): string {
    let historyBlock = ''
    if (query.history && query.history.length > 0) {
      historyBlock = '\n\nCONVERSATION HISTORY:\n' + query.history
        .map(m => `${m.role === 'user' ? 'User' : 'Assistant'}: ${m.content}`)
        .join('\n')
    }
    return `${SYSTEM_PROMPT}\n\nCONTEXT:\n${context}${historyBlock}\n\nQUESTION: ${query.text}\n\nANSWER:`
  }

  async execute(query: Query): Promise<Answer> {
    const queryVector = await this.embedder.embed(query.text)
    const results = await this.indexRepo.querySimilar(queryVector, this.topK * 5, query.text)

    const sources = this.deduplicateSources(results)

    if (results.length === 0) {
      return { text: 'I couldn\'t find any relevant information about that in the Acceleracers wiki.', sources }
    }

    const reranked = mmrSelect(results, this.topK)
    const context = reranked.map(r => r.chunk.text).join('\n\n---\n\n')
    const prompt = this.buildPrompt(query, context)

    let text = ''
    for await (const token of this.llm.generate(prompt)) {
      text += token
    }

    return { text, sources }
  }

  async *stream(query: Query): AsyncIterable<string> {
    const queryVector = await this.embedder.embed(query.text)
    const results = await this.indexRepo.querySimilar(queryVector, this.topK * 5, query.text)

    const sources = this.deduplicateSources(results)

    if (results.length === 0) {
      yield 'I couldn\'t find any relevant information about that in the Acceleracers wiki.'
      yield `||SOURCES||${JSON.stringify(sources)}`
      return
    }

    const reranked = mmrSelect(results, this.topK)
    const context = reranked.map(r => r.chunk.text).join('\n\n---\n\n')
    const prompt = this.buildPrompt(query, context)

    for await (const token of this.llm.generate(prompt)) {
      yield token
    }

    yield `||SOURCES||${JSON.stringify(sources)}`
  }
}
