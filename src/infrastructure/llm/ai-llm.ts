import { streamText } from 'ai'
import type { LanguageModel } from 'ai'
import type { LLMService } from '../../domain/repositories/llm-service.js'

export class AILlmAdapter implements LLMService {
  constructor(private readonly model: LanguageModel) {}

  async *generate(prompt: string): AsyncIterable<string> {
    const result = streamText({
      model: this.model,
      prompt,
    })

    for await (const token of result.textStream) {
      yield token
    }
  }
}
