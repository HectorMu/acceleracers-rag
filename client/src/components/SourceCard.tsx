import React, { useState, useRef } from 'react'

interface Props {
  title: string
  url: string
  excerpt?: string
}

export function SourceCard({ title, url, excerpt }: Props) {
  const [showPopover, setShowPopover] = useState(false)
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const handleMouseEnter = (e: React.MouseEvent<HTMLAnchorElement>) => {
    const el = e.currentTarget
    el.style.borderColor = 'var(--color-accent-1)'
    el.style.color = 'var(--color-accent-1)'
    if (excerpt) {
      timeoutRef.current = setTimeout(() => setShowPopover(true), 400)
    }
  }

  const handleMouseLeave = (e: React.MouseEvent<HTMLAnchorElement>) => {
    const el = e.currentTarget
    el.style.borderColor = 'var(--color-border)'
    el.style.color = 'var(--color-text-secondary)'
    if (timeoutRef.current) clearTimeout(timeoutRef.current)
    setShowPopover(false)
  }

  return (
    <div style={{ position: 'relative', display: 'inline-flex' }}>
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
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        <span>📄</span>
        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{title}</span>
        <span>↗</span>
      </a>
      {showPopover && excerpt && (
        <div
          style={{
            position: 'absolute',
            bottom: 'calc(100% + 8px)',
            left: '50%',
            transform: 'translateX(-50%)',
            maxWidth: '20rem',
            padding: '0.625rem 0.75rem',
            borderRadius: '0.5rem',
            background: 'var(--color-surface-3)',
            border: '1px solid var(--color-border)',
            fontSize: '0.78rem',
            lineHeight: '1.5',
            color: 'var(--color-text-primary)',
            zIndex: 100,
            pointerEvents: 'none',
            boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
          }}
        >
          {excerpt}
        </div>
      )}
    </div>
  )
}
