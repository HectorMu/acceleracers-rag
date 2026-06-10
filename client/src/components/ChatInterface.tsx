import { ArrowUp } from 'lucide-react'
import { useState } from 'react'

interface Props {
  onSend: (message: string) => void
  disabled: boolean
  maxLength?: number
  connected?: boolean
}

const MAX = 500

export function ChatInterface({ onSend, disabled, maxLength = MAX, connected = true }: Props) {
  const [input, setInput] = useState('')
  const overLimit = input.length > maxLength

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const trimmed = input.trim()
    if (!trimmed || disabled || overLimit) return
    onSend(trimmed)
    setInput('')
  }

  return (
    <form onSubmit={handleSubmit} style={{ padding: '1rem 0', borderTop: '1px solid var(--color-border)' }}>
      {!connected && (
        <div style={{ fontSize: '0.75rem', color: '#e67e22', marginBottom: '0.5rem', textAlign: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.375rem' }}>
          <span style={{ width: '0.5rem', height: '0.5rem', borderRadius: '50%', background: '#e67e22', display: 'inline-block' }} />
          Server unreachable — check that Ollama and the backend are running
        </div>
      )}
      <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', background: 'var(--color-surface-2)', borderRadius: '0.75rem', border: `1px solid ${overLimit ? '#e63946' : 'var(--color-border)'}`, padding: '0.25rem', transition: 'border-color 0.15s' }}>
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
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
          {input.length > 0 && (
            <span style={{ fontSize: '0.7rem', color: overLimit ? '#e63946' : 'var(--color-text-secondary)', fontVariantNumeric: 'tabular-nums' }}>
              {input.length}/{maxLength}
            </span>
          )}
          <button
            type="submit"
            disabled={disabled || !input.trim() || overLimit}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '2.25rem',
              height: '2.25rem',
              borderRadius: '0.5rem',
              background: input.trim() && !overLimit ? 'var(--color-accent-1)' : 'var(--color-surface-3)',
              border: 'none',
              color: '#fff',
              cursor: input.trim() && !overLimit ? 'pointer' : 'default',
              transition: 'all 0.15s',
              flexShrink: 0,
            }}
          >
            <ArrowUp size={18} />
          </button>
        </div>
      </div>
      {overLimit && (
        <p style={{ fontSize: '0.75rem', color: '#e63946', marginTop: '0.25rem', marginLeft: '0.25rem' }}>
          Message too long — max {maxLength} characters
        </p>
      )}
    </form>
  )
}
