import { useState, useCallback } from 'react'

export interface Message {
  role: 'user' | 'assistant'
  content: string
  sources?: { title: string; url: string; excerpt?: string }[]
}

interface UseChatStreamOptions {
  conversationId: string | null
  history: Message[]
  onAddMessage: (id: string, msg: Message) => void
  onUpdateLastMessage: (id: string, content: string, sources?: Message['sources']) => void
  onToast?: (message: string, type: 'error' | 'warning' | 'info') => void
}

async function tryReadError(res: Response): Promise<string> {
  try {
    const body = await res.clone().json()
    if (body.error) return body.error
    if (body.suggestion) return `${body.error} — ${body.suggestion}`
  } catch {}
  try {
    const text = await res.clone().text()
    if (text) return text.slice(0, 200)
  } catch {}
  return `Server returned ${res.status}`
}

function isAbortError(err: unknown): boolean {
  return err instanceof DOMException && err.name === 'AbortError'
}

export function useChatStream({ conversationId, history, onAddMessage, onUpdateLastMessage, onToast }: UseChatStreamOptions) {
  const [streamingText, setStreamingText] = useState('')
  const [isStreaming, setIsStreaming] = useState(false)

  const sendMessage = useCallback(async (text: string) => {
    if (!conversationId) return
    const userMsg: Message = { role: 'user', content: text }
    onAddMessage(conversationId, userMsg)
    setIsStreaming(true)
    setStreamingText('')

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text, history }),
      })

      if (!response.ok) {
        const errMsg = await tryReadError(response)
        if (response.status === 429) {
          onToast?.(errMsg || 'Too many requests. Please wait a moment.', 'warning')
          return
        }
        if (response.status === 400) {
          onToast?.(errMsg || 'Invalid request.', 'warning')
          return
        }
        onAddMessage(conversationId, { role: 'assistant', content: `**Error:** ${errMsg}` })
        return
      }

      if (!response.body) throw new Error('Response has no body')

      const reader = response.body.getReader()
      const decoder = new TextDecoder()
      let buffer = ''
      let fullAnswer = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n')
        buffer = lines.pop() || ''

        for (const line of lines) {
          const trimmed = line.trim()
          if (!trimmed || trimmed.startsWith('event:')) continue

          if (trimmed.startsWith('data: ')) {
            const data = trimmed.slice(6)
            try {
              const parsed = JSON.parse(data)

              if (parsed.error) {
                onUpdateLastMessage(conversationId, `**Error:** ${parsed.error}`)
                setStreamingText('')
                return
              }

              if (parsed.token) {
                fullAnswer += parsed.token
                setStreamingText(fullAnswer)
              }

              if (parsed.sources) {
                onUpdateLastMessage(conversationId, fullAnswer, parsed.sources)
                setStreamingText('')
              }
            } catch {
              // skip malformed SSE data
            }
          }
        }
      }

      if (fullAnswer) {
        onUpdateLastMessage(conversationId, fullAnswer)
        setStreamingText('')
      }
    } catch (err) {
      if (isAbortError(err)) {
        // request was aborted — likely timeout from slow model, don't confuse the user
        return
      }
      console.error('Chat error:', err)
      const isNetwork = err instanceof TypeError && (err as any).cause === undefined
      onAddMessage(conversationId, {
        role: 'assistant',
        content: isNetwork
          ? '**Connection error:** Can\'t reach the server. Make sure Ollama is running and the server is started.'
          : '**Error:** Something went wrong while processing your request.',
      })
    } finally {
      setIsStreaming(false)
      setStreamingText('')
    }
  }, [conversationId, history, onAddMessage, onUpdateLastMessage, onToast])

  return { streamingText, isStreaming, sendMessage }
}
