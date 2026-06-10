import type { LLMService } from '../../domain/repositories/llm-service.js'

export class OllamaLLM implements LLMService {
  constructor(
    private readonly url: string,
    private readonly model: string
  ) {}

  async *generate(prompt: string): AsyncIterable<string> {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 60000)

    const res = await fetch(`${this.url}/api/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ model: this.model, prompt, stream: true }),
      signal: controller.signal,
    })
    clearTimeout(timeout)

    if (!res.ok) {
      throw new Error(`Ollama returned ${res.status}: ${await res.text().catch(() => 'unknown error')}`)
    }
    if (!res.body) throw new Error('Ollama response has no body')

    const reader = res.body.getReader()
    const decoder = new TextDecoder()
    let buffer = ''

    while (true) {
      const { done, value } = await reader.read()
      if (done) break

      buffer += decoder.decode(value, { stream: true })
      const lines = buffer.split('\n')
      buffer = lines.pop() || ''

      for (const line of lines) {
        const trimmed = line.trim()
        if (!trimmed) continue
        try {
          const json = JSON.parse(trimmed)
          if (json.response) yield json.response
          if (json.done) return
        } catch {
          // skip malformed lines from Ollama
        }
      }
    }
  }
}
