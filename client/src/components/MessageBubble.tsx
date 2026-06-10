interface Props {
  role: 'user' | 'assistant'
  content: string
}

export function MessageBubble({ role, content }: Props) {
  const isUser = role === 'user'

  return (
    <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
      <div
        style={{
          width: '2.25rem',
          height: '2.25rem',
          borderRadius: '0.5rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '1rem',
          flexShrink: 0,
          background: isUser ? 'var(--color-accent-1)' : 'var(--color-surface-3)',
        }}
      >
        {isUser ? '👤' : '🤖'}
      </div>
      <div
        style={{
          flex: 1,
          padding: '0.625rem 1rem',
          borderRadius: '0.75rem',
          background: isUser ? 'var(--color-user-bubble)' : 'var(--color-assistant-bubble)',
          border: '1px solid var(--color-border)',
          fontSize: '0.9rem',
          lineHeight: '1.6',
          whiteSpace: 'pre-wrap',
          wordBreak: 'break-word',
        }}
      >
        {content || <span style={{ color: 'var(--color-text-secondary)', fontStyle: 'italic' }}>(empty response)</span>}
      </div>
    </div>
  )
}
