interface Props {
  title: string
  url: string
}

export function SourceCard({ title, url }: Props) {
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '0.375rem',
        padding: '0.25rem 0.625rem',
        borderRadius: '0.5rem',
        background: 'var(--color-surface-2)',
        border: '1px solid var(--color-border)',
        fontSize: '0.75rem',
        color: 'var(--color-text-secondary)',
        textDecoration: 'none',
        transition: 'all 0.15s',
        cursor: 'pointer',
        maxWidth: '100%',
      }}
      onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'var(--color-accent-1)'; e.currentTarget.style.color = 'var(--color-accent-1)' }}
      onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--color-border)'; e.currentTarget.style.color = 'var(--color-text-secondary)' }}
    >
      <span>📄</span>
      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{title}</span>
      <span>↗</span>
    </a>
  )
}
