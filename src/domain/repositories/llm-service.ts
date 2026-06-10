export interface LLMService {
  generate(prompt: string): AsyncIterable<string>
}
