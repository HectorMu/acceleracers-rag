export interface LLMService {
  generate(system: string, userPrompt: string): AsyncIterable<string>
}
