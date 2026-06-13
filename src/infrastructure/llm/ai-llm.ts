import { streamText } from 'ai'
import type { LanguageModel } from 'ai'
import type { LLMService } from '../../domain/repositories/llm-service.js'

export class AILlmAdapter implements LLMService {
  constructor(private readonly model: LanguageModel) {}

  async *generate(system: string, userPrompt: string): AsyncIterable<string> {
    const result = streamText({
      model: this.model,
      system,
      messages: [{ role: 'user', content: userPrompt }],
    })

    for await (const token of result.textStream) {
      yield token
    }
  }
}
