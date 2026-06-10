import { Plus, MessageSquare, Trash2 } from 'lucide-react'
import type { Conversation } from '../hooks/useConversations.js'

interface Props {
  conversations: Conversation[]
  activeId: string | null
  onNew: () => void
  onSelect: (id: string) => void
  onDelete: (id: string) => void
  open: boolean
  onToggle: () => void
}

export function Sidebar({ conversations, activeId, onNew, onSelect, onDelete, open, onToggle }: Props) {
  return (
    <>
      {open && <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 98 }} onClick={onToggle} />}

      <aside
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          bottom: 0,
          width: '16rem',
          background: 'var(--color-surface-1)',
          borderRight: '1px solid var(--color-border)',
          zIndex: 99,
          display: 'flex',
          flexDirection: 'column',
          transform: open ? 'translateX(0)' : 'translateX(-100%)',
          transition: 'transform 0.2s ease',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.75rem 1rem', borderBottom: '1px solid var(--color-border)' }}>
          <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>Chat History</span>
          <button
            onClick={onNew}
            title="New chat"
            style={{ background: 'var(--color-accent-1)', border: 'none', color: '#fff', borderRadius: '0.375rem', padding: '0.3rem 0.6rem', cursor: 'pointer', fontSize: '0.75rem', fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: '0.25rem' }}
          >
            <Plus size={14} /> New
          </button>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: '0.5rem' }}>
          {conversations.length === 0 && (
            <p style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)', textAlign: 'center', padding: '2rem 0' }}>
              No conversations yet
            </p>
          )}

          {conversations.map(convo => (
            <div
              key={convo.id}
              onClick={() => onSelect(convo.id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.5rem',
                borderRadius: '0.5rem',
                cursor: 'pointer',
                marginBottom: '0.25rem',
                background: convo.id === activeId ? 'var(--color-surface-3)' : 'transparent',
                transition: 'background 0.15s',
              }}
              onMouseEnter={e => { if (convo.id !== activeId) e.currentTarget.style.background = 'var(--color-surface-2)' }}
              onMouseLeave={e => { if (convo.id !== activeId) e.currentTarget.style.background = 'transparent' }}
            >
              <MessageSquare size={14} style={{ flexShrink: 0, color: 'var(--color-text-secondary)' }} />
              <span style={{ flex: 1, fontSize: '0.8rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {convo.title}
              </span>
              <button
                onClick={e => { e.stopPropagation(); onDelete(convo.id) }}
                title="Delete"
                style={{ background: 'none', border: 'none', color: 'var(--color-text-secondary)', cursor: 'pointer', padding: '0.15rem', display: 'flex', opacity: 0, transition: 'opacity 0.15s' }}
                onMouseEnter={e => e.currentTarget.style.opacity = '1'}
                onMouseLeave={e => e.currentTarget.style.opacity = '0'}
                className="delete-btn"
              >
                <Trash2 size={12} />
              </button>
            </div>
          ))}
        </div>

        <style>{`
          div:hover > .delete-btn { opacity: 1 !important; }
          button:focus-visible { outline: 2px solid var(--color-accent-1); outline-offset: 2px; }
        `}</style>
      </aside>
    </>
  )
}
