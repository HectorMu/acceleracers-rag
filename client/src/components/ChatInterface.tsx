import { ArrowUp } from 'lucide-react'
import { useState } from 'react'

interface Props {
  onSend: (message: string) => void
  disabled: boolean
}

export function ChatInterface({ onSend, disabled }: Props) {
  const [input, setInput] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const trimmed = input.trim()
    if (!trimmed || disabled) return
    onSend(trimmed)
    setInput('')
  }

  return (
    <form onSubmit={handleSubmit} style={{ padding: '1rem 0', borderTop: '1px solid var(--color-border)' }}>
      <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', background: 'var(--color-surface-2)', borderRadius: '0.75rem', border: '1px solid var(--color-border)', padding: '0.25rem' }}>
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask about Acceleracers..."
          disabled={disabled}
          style={{
            flex: 1,
            background: 'transparent',
            border: 'none',
            outline: 'none',
            color: 'var(--color-text-primary)',
            padding: '0.625rem 0.75rem',
            fontSize: '0.9rem',
            fontFamily: 'inherit',
          }}
          autoFocus
        />
        <button
          type="submit"
          disabled={disabled || !input.trim()}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '2.25rem',
            height: '2.25rem',
            borderRadius: '0.5rem',
            background: input.trim() ? 'var(--color-accent-1)' : 'var(--color-surface-3)',
            border: 'none',
            color: '#fff',
            cursor: input.trim() ? 'pointer' : 'default',
            transition: 'all 0.15s',
            flexShrink: 0,
          }}
        >
          <ArrowUp size={18} />
        </button>
      </div>
    </form>
  )
}
