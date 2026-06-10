import { useState, useRef, useEffect, useCallback } from 'react'
import { ChatInterface } from './components/ChatInterface.js'
import { MessageBubble } from './components/MessageBubble.js'
import { StreamingText } from './components/StreamingText.js'
import { SourceCard } from './components/SourceCard.js'
import { ThinkingIndicator } from './components/ThinkingIndicator.js'
import { Sidebar } from './components/Sidebar.js'
import { ToastContainer } from './components/ToastContainer.js'
import { useConversations } from './hooks/useConversations.js'
import { useChatStream } from './hooks/useChatStream.js'
import { useToast } from './hooks/useToast.js'
import { Bot, Sparkles, Menu } from 'lucide-react'

const SUGGESTIONS = [
  'Who is Vert Wheeler?',
  'What is an Accelecharger?',
  'Tell me about the Racing Realms',
  'What teams are in the World Race?',
  'Who are the Metal Maniacs?',
  'What happened in the Storm Realm?',
]

export default function App() {
  const {
    conversations, activeId, activeConversation,
    createConversation, deleteConversation, addMessage, updateLastMessage, switchConversation,
  } = useConversations()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [connected, setConnected] = useState(true)
  const { toasts, addToast, dismissToast } = useToast()

  useEffect(() => {
    if (!activeId && conversations.length === 0) {
      createConversation()
    } else if (!activeId && conversations.length > 0) {
      switchConversation(conversations[0].id)
    }
  }, [])

  const history = activeConversation
    ? activeConversation.messages.map(m => ({ role: m.role, content: m.content }))
    : []

  const onToast = useCallback((message: string, type: 'error' | 'warning' | 'info') => {
    addToast(message, type)
  }, [addToast])

  const { streamingText, isStreaming, sendMessage } = useChatStream({
    conversationId: activeId,
    history,
    onAddMessage: addMessage,
    onUpdateLastMessage: updateLastMessage,
    onToast,
  })

  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [activeConversation?.messages, streamingText])

  // Health check for connection status
  useEffect(() => {
    let mounted = true
    const check = () => {
      fetch('/api/health')
        .then(r => { if (mounted) setConnected(r.ok) })
        .catch(() => { if (mounted) setConnected(false) })
    }
    check()
    const interval = setInterval(check, 15000)
    return () => { mounted = false; clearInterval(interval) }
  }, [])

  const displayMessages = activeConversation?.messages || []

  const handleSend = (text: string) => {
    sendMessage(text)
  }

  const handleNewChat = () => {
    createConversation()
    setSidebarOpen(false)
  }

  const handleSelect = (id: string) => {
    switchConversation(id)
    setSidebarOpen(false)
  }

  return (
    <>
      <Sidebar
        conversations={conversations}
        activeId={activeId}
        onNew={handleNewChat}
        onSelect={handleSelect}
        onDelete={deleteConversation}
        open={sidebarOpen}
        onToggle={() => setSidebarOpen(false)}
      />

      <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', maxWidth: '48rem', margin: '0 auto', width: '100%', padding: '0 1rem' }}>
        <header style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '1.25rem 0', borderBottom: '1px solid var(--color-border)' }}>
          <button
            onClick={() => setSidebarOpen(true)}
            title="Chat history"
            style={{ background: 'none', border: 'none', color: 'var(--color-text-secondary)', cursor: 'pointer', padding: '0.25rem', display: 'flex' }}
          >
            <Menu size={20} />
          </button>
          <div style={{ width: '2.5rem', height: '2.5rem', borderRadius: '0.75rem', background: 'linear-gradient(135deg, var(--color-accent-1), #e63946)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.25rem' }}>🏎️</div>
          <div>
            <h1 style={{ fontSize: '1.25rem', fontWeight: 700, letterSpacing: '-0.02em' }}>AcceleRAG</h1>
            <p style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)' }}>Acceleracers Knowledge Base</p>
          </div>
          <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <div
              title={connected ? 'Connected' : 'Server unreachable'}
              style={{
                width: '0.5rem',
                height: '0.5rem',
                borderRadius: '50%',
                background: connected ? '#2ecc71' : '#e63946',
                transition: 'background 0.3s',
              }}
            />
            <Sparkles size={14} style={{ color: 'var(--color-text-secondary)' }} />
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
                    onClick={() => handleSend(q)}
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

          {activeConversation && displayMessages.map((msg, i) => (
            <div key={i} style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <MessageBubble role={msg.role} content={msg.content} />
              {msg.role === 'assistant' && msg.sources && msg.sources.length > 0 && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', paddingLeft: '3rem' }}>
                  {msg.sources.map((s, j) => (
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

        <ChatInterface
          onSend={handleSend}
          disabled={isStreaming}
          maxLength={500}
          connected={connected}
        />
      </div>

      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
    </>
  )
}
