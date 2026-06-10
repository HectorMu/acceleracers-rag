export function ThinkingIndicator() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', paddingLeft: '3rem' }}>
      <div style={{ display: 'flex', gap: '0.25rem', padding: '0.75rem 1rem', background: 'var(--color-assistant-bubble)', borderRadius: '1rem', border: '1px solid var(--color-border)' }}>
        {[0, 1, 2].map(i => (
          <div
            key={i}
            className="thinking-dot"
            style={{
              width: '0.5rem',
              height: '0.5rem',
              borderRadius: '50%',
              background: 'var(--color-accent-1)',
              animationDelay: `${i * 0.16}s`,
            }}
          />
        ))}
      </div>
    </div>
  )
}
