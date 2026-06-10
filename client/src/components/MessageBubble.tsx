import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

interface Props {
  role: 'user' | 'assistant'
  content: string
}

const codeBlockStyle: React.CSSProperties = {
  background: 'var(--color-surface-3)',
  padding: '0.75rem 1rem',
  borderRadius: '0.5rem',
  fontSize: '0.8rem',
  overflowX: 'auto',
  margin: '0.5rem 0',
}

const inlineCodeStyle: React.CSSProperties = {
  background: 'var(--color-surface-3)',
  padding: '0.1rem 0.35rem',
  borderRadius: '0.25rem',
  fontSize: '0.8rem',
}

const linkStyle: React.CSSProperties = {
  color: 'var(--color-accent-1)',
  textDecoration: 'none',
}

const tableStyle: React.CSSProperties = {
  borderCollapse: 'collapse',
  width: '100%',
  margin: '0.5rem 0',
  fontSize: '0.85rem',
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
          wordBreak: 'break-word',
          overflow: 'hidden',
        }}
      >
        {!content ? (
          <span style={{ color: 'var(--color-text-secondary)', fontStyle: 'italic' }}>(empty response)</span>
        ) : isUser ? (
          <span style={{ whiteSpace: 'pre-wrap' }}>{content}</span>
        ) : (
          <div style={{ whiteSpace: 'pre-wrap' }}>
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={{
                code({ className, children, ...props }) {
                  const isInline = !className
                  return isInline ? (
                    <code style={inlineCodeStyle} {...props}>{children}</code>
                  ) : (
                    <pre style={codeBlockStyle}><code className={className} {...props}>{children}</code></pre>
                  )
                },
                a({ href, children }) {
                  return <a href={href} target="_blank" rel="noopener noreferrer" style={linkStyle}>{children}</a>
                },
                table({ children }) {
                  return (
                    <table style={tableStyle}>
                      {children}
                    </table>
                  )
                },
                th({ children }) {
                  return <th style={{ border: '1px solid var(--color-border)', padding: '0.4rem 0.6rem', background: 'var(--color-surface-3)' }}>{children}</th>
                },
                td({ children }) {
                  return <td style={{ border: '1px solid var(--color-border)', padding: '0.4rem 0.6rem' }}>{children}</td>
                },
              }}
            >
              {content}
            </ReactMarkdown>
          </div>
        )}
      </div>
    </div>
  )
}
