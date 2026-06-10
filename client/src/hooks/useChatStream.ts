import { useState, useCallback } from 'react'

export interface Message {
  role: 'user' | 'assistant'
  content: string
  sources?: { title: string; url: string }[]
}

export function useChatStream() {
  const [messages, setMessages] = useState<Message[]>([])
  const [streamingText, setStreamingText] = useState('')
  const [isStreaming, setIsStreaming] = useState(false)

  const sendMessage = useCallback(async (text: string) => {
    const userMsg: Message = { role: 'user', content: text }
    setMessages(prev => [...prev, userMsg])
    setIsStreaming(true)
    setStreamingText('')

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text }),
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
                const assistantMsg: Message = {
                  role: 'assistant',
                  content: fullAnswer,
                  sources: parsed.sources,
                }
                setMessages(prev => [...prev, assistantMsg])
                setStreamingText('')
              }
            } catch {
              // skip malformed SSE data
            }
          }
        }
      }

      // Connection closed without a done event — save partial answer
      if (fullAnswer) {
        setMessages(prev => {
          // Check if the last message is already this answer
          const last = prev[prev.length - 1]
          if (last?.role === 'assistant' && last.content === fullAnswer) return prev
          return [...prev, { role: 'assistant', content: fullAnswer, sources: [] }]
        })
        setStreamingText('')
      }
    } catch (err) {
      console.error('Chat error:', err)
      setMessages(prev => [...prev, { role: 'assistant', content: 'Sorry, something went wrong. Is the server running?' }])
    } finally {
      setIsStreaming(false)
      setStreamingText('')
    }
  }, [])

  return { messages, streamingText, isStreaming, sendMessage }
}
