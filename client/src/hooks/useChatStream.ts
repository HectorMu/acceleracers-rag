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
}

export function useChatStream({ conversationId, history, onAddMessage, onUpdateLastMessage }: UseChatStreamOptions) {
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

      if (!response.ok) throw new Error(`HTTP ${response.status}`)
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
      console.error('Chat error:', err)
      onAddMessage(conversationId, { role: 'assistant', content: 'Sorry, something went wrong. Is the server running?' })
    } finally {
      setIsStreaming(false)
      setStreamingText('')
    }
  }, [conversationId, history, onAddMessage, onUpdateLastMessage])

  return { streamingText, isStreaming, sendMessage }
}
