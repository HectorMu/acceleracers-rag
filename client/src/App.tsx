import { useState, useRef, useEffect } from 'react'
import { ChatInterface } from './components/ChatInterface.js'
import { MessageBubble } from './components/MessageBubble.js'
import { StreamingText } from './components/StreamingText.js'
import { SourceCard } from './components/SourceCard.js'
import { ThinkingIndicator } from './components/ThinkingIndicator.js'
import { useChatStream } from './hooks/useChatStream.js'
import { Bot, Sparkles, Trash2, Settings } from 'lucide-react'

const SUGGESTIONS = [
  'Who is Vert Wheeler?',
  'What is an Accelecharger?',
  'Tell me about the Racing Realms',
  'What teams are in the World Race?',
  'Who are the Metal Maniacs?',
  'What happened in the Storm Realm?',
]

const STORAGE_KEY = 'accelerag_history'

function loadHistory(): { id: number; role: 'user' | 'assistant'; content: string; sources?: { title: string; url: string; excerpt?: string }[] }[] {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]')
  } catch { return [] }
}

function saveHistory(messages: any[]) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(messages.slice(-50))) } catch {}
}

export default function App() {
  const { messages, streamingText, isStreaming, sendMessage } = useChatStream()
  const [historyLoaded, setHistoryLoaded] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)
  const chatRef = useRef(messages)

  useEffect(() => {
    if (!historyLoaded && messages.length === 0) {
      const saved = loadHistory()
      if (saved.length > 0) {
        for (const m of saved) {
          chatRef.current = [...chatRef.current, m]
        }
      }
      setHistoryLoaded(true)
    }
  }, [historyLoaded])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, streamingText])

  useEffect(() => {
    if (messages.length > 0) {
      saveHistory(messages)
    }
  }, [messages])

  const totalMessages = messages.length > 0 ? messages : (() => {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]') } catch { return [] }
  })()

  const displayMessages = totalMessages.length > 0 ? totalMessages : []

  const clearHistory = () => {
    localStorage.removeItem(STORAGE_KEY)
    window.location.reload()
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', maxWidth: '48rem', margin: '0 auto', width: '100%', padding: '0 1rem' }}>
      <header style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '1.25rem 0', borderBottom: '1px solid var(--color-border)' }}>
        <div style={{ width: '2.5rem', height: '2.5rem', borderRadius: '0.75rem', background: 'linear-gradient(135deg, var(--color-accent-1), #e63946)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.25rem' }}>🏎️</div>
        <div>
          <h1 style={{ fontSize: '1.25rem', fontWeight: 700, letterSpacing: '-0.02em' }}>AcceleRAG</h1>
          <p style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)' }}>Acceleracers Knowledge Base</p>
        </div>
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          {displayMessages.length > 0 && (
            <button
              onClick={clearHistory}
              title="Clear chat history"
              style={{ background: 'none', border: 'none', color: 'var(--color-text-secondary)', cursor: 'pointer', padding: '0.25rem', display: 'flex' }}
            >
              <Trash2 size={16} />
            </button>
          )}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>
            <Sparkles size={14} />
            <span>RAG</span>
          </div>
        </div>
      </header>

      <main style={{ flex: 1, overflowY: 'auto', padding: '1rem 0', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {displayMessages.length === 0 && !isStreaming && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: '1.5rem', color: 'var(--color-text-secondary)' }}>
            <Bot size={48} strokeWidth={1} />
            <p style={{ fontSize: '1.1rem', fontWeight: 500 }}>Ask me about Acceleracers!</p>
            <p style={{ fontSize: '0.85rem', textAlign: 'center', maxWidth: '24rem' }}>
              Characters, realms, accelechargers, teams — I know the Acceleracers universe inside out.
            </p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', justifyContent: 'center', maxWidth: '32rem' }}>
              {SUGGESTIONS.map((q) => (
                <button
                  key={q}
                  onClick={() => sendMessage(q)}
                  style={{
                    padding: '0.4rem 0.8rem',
                    borderRadius: '1rem',
                    background: 'var(--color-surface-2)',
                    border: '1px solid var(--color-border)',
                    color: 'var(--color-text-secondary)',
                    fontSize: '0.8rem',
                    cursor: 'pointer',
                    transition: 'all 0.15s',
                    fontFamily: 'inherit',
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'var(--color-accent-1)'; e.currentTarget.style.color = 'var(--color-accent-1)' }}
                  onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--color-border)'; e.currentTarget.style.color = 'var(--color-text-secondary)' }}
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
        )}

        {displayMessages.map((msg: any, i: number) => (
          <div key={i} style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <MessageBubble role={msg.role} content={msg.content} />
            {msg.role === 'assistant' && msg.sources && msg.sources.length > 0 && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', paddingLeft: '3rem' }}>
                {msg.sources.map((s: any, j: number) => (
                  <SourceCard key={j} title={s.title} url={s.url} excerpt={s.excerpt} />
                ))}
              </div>
            )}
          </div>
        ))}

        {isStreaming && streamingText && <StreamingText text={streamingText} />}
        {isStreaming && !streamingText && <ThinkingIndicator />}

        <div ref={bottomRef} />
      </main>

      <ChatInterface onSend={sendMessage} disabled={isStreaming} />
    </div>
  )
}
