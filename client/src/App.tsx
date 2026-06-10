import { useState, useRef, useEffect } from 'react'
import { ChatInterface } from './components/ChatInterface.js'
import { MessageBubble } from './components/MessageBubble.js'
import { StreamingText } from './components/StreamingText.js'
import { SourceCard } from './components/SourceCard.js'
import { ThinkingIndicator } from './components/ThinkingIndicator.js'
import { useChatStream } from './hooks/useChatStream.js'
import { Bot, Sparkles } from 'lucide-react'

export default function App() {
  const { messages, streamingText, isStreaming, sources, sendMessage } = useChatStream()
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, streamingText])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', maxWidth: '48rem', margin: '0 auto', width: '100%', padding: '0 1rem' }}>
      <header style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '1.25rem 0', borderBottom: '1px solid var(--color-border)' }}>
        <div style={{ width: '2.5rem', height: '2.5rem', borderRadius: '0.75rem', background: 'linear-gradient(135deg, var(--color-accent-1), #e63946)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.25rem' }}>🏎️</div>
        <div>
          <h1 style={{ fontSize: '1.25rem', fontWeight: 700, letterSpacing: '-0.02em' }}>AcceleRAG</h1>
          <p style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)' }}>Acceleracers Knowledge Base</p>
        </div>
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>
          <Sparkles size={14} />
          <span>RAG-powered</span>
        </div>
      </header>

      <main style={{ flex: 1, overflowY: 'auto', padding: '1rem 0', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {messages.length === 0 && !isStreaming && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: '1rem', color: 'var(--color-text-secondary)' }}>
            <Bot size={48} strokeWidth={1} />
            <p style={{ fontSize: '1.1rem', fontWeight: 500 }}>Ask me about Acceleracers!</p>
            <p style={{ fontSize: '0.85rem', textAlign: 'center', maxWidth: '24rem' }}>
              Characters, realms, accelechargers, teams — I know the Acceleracers universe inside out.
            </p>
          </div>
        )}

        {messages.map((msg, i) => (
          <div key={i} style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <MessageBubble role={msg.role} content={msg.content} />
            {msg.role === 'assistant' && msg.sources && msg.sources.length > 0 && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', paddingLeft: '3rem' }}>
                {msg.sources.map((s, j) => (
                  <SourceCard key={j} title={s.title} url={s.url} />
                ))}
              </div>
            )}
          </div>
        ))}

        {isStreaming && streamingText && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <MessageBubble role="assistant" content="" />
            <StreamingText text={streamingText} />
          </div>
        )}

        {isStreaming && !streamingText && <ThinkingIndicator />}

        {sources.length > 0 && !isStreaming && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', paddingLeft: '3rem' }}>
            {sources.map((s, j) => (
              <SourceCard key={j} title={s.title} url={s.url} />
            ))}
          </div>
        )}

        <div ref={bottomRef} />
      </main>

      <ChatInterface onSend={sendMessage} disabled={isStreaming} />
    </div>
  )
}
