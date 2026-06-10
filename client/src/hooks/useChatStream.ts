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
  const [sources, setSources] = useState<{ title: string; url: string }[]>([])

  const sendMessage = useCallback(async (text: string) => {
    const userMsg: Message = { role: 'user', content: text }
    setMessages(prev => [...prev, userMsg])
    setIsStreaming(true)
    setStreamingText('')
    setSources([])

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text }),
      })

      if (!response.ok) throw new Error(`HTTP ${response.status}`)

      const reader = response.body!.getReader()
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

          if (trimmed.startsWith('event: token')) continue
          if (trimmed.startsWith('event: done')) continue

          if (trimmed.startsWith('data: ')) {
            const data = trimmed.slice(6)
            try {
              const parsed = JSON.parse(data)

              if (parsed.token) {
                fullAnswer += parsed.token
                setStreamingText(fullAnswer)
              }

              if (parsed.sources) {
                setSources(parsed.sources)
                const assistantMsg: Message = {
                  role: 'assistant',
                  content: fullAnswer,
                  sources: parsed.sources,
                }
                setMessages(prev => [...prev, assistantMsg])
                setStreamingText('')
              }

              if (parsed.answer && !parsed.token) {
                fullAnswer = parsed.answer
                setStreamingText(fullAnswer)
              }
            } catch {}
          }
        }
      }
    } catch (err) {
      console.error('Chat error:', err)
      setMessages(prev => [...prev, { role: 'assistant', content: 'Sorry, something went wrong. Is the server running?' }])
    } finally {
      setIsStreaming(false)
      setStreamingText('')
    }
  }, [])

  return { messages, streamingText, isStreaming, sources, sendMessage }
}
