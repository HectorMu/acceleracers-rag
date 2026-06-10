export function ThinkingIndicator() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', paddingLeft: '3rem' }}>
      <div style={{ display: 'flex', gap: '0.25rem', padding: '0.75rem 1rem', background: 'var(--color-assistant-bubble)', borderRadius: '1rem', border: '1px solid var(--color-border)' }}>
        {[0, 1, 2].map(i => (
          <div
            key={i}
            style={{
              width: '0.5rem',
              height: '0.5rem',
              borderRadius: '50%',
              background: 'var(--color-accent-1)',
              animation: `bounce 1.4s ease-in-out ${i * 0.16}s infinite`,
            }}
          />
        ))}
      </div>
      <style>{`
        @keyframes bounce {
          0%, 80%, 100% { transform: scale(0.6); opacity: 0.4; }
          40% { transform: scale(1); opacity: 1; }
        }
      `}</style>
    </div>
  )
}
