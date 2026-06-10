import type { Toast } from '../hooks/useToast.js'
import { X } from 'lucide-react'

interface Props {
  toasts: Toast[]
  onDismiss: (id: number) => void
}

const bgMap: Record<string, string> = {
  error: '#e63946',
  warning: '#e67e22',
  info: 'var(--color-accent-1)',
}

export function ToastContainer({ toasts, onDismiss }: Props) {
  if (toasts.length === 0) return null

  return (
    <div style={{ position: 'fixed', bottom: '5rem', left: '50%', transform: 'translateX(-50%)', zIndex: 200, display: 'flex', flexDirection: 'column', gap: '0.5rem', maxWidth: '28rem', width: '100%', pointerEvents: 'none' }}>
      {toasts.map(toast => (
        <div
          key={toast.id}
          style={{
            background: bgMap[toast.type],
            color: '#fff',
            padding: '0.625rem 1rem',
            borderRadius: '0.5rem',
            fontSize: '0.85rem',
            lineHeight: '1.4',
            boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            pointerEvents: 'auto',
            animation: 'slideUp 0.2s ease',
          }}
        >
          <span style={{ flex: 1 }}>{toast.message}</span>
          <button
            onClick={() => onDismiss(toast.id)}
            style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer', padding: '0.15rem', display: 'flex', flexShrink: 0, opacity: 0.8 }}
          >
            <X size={14} />
          </button>
        </div>
      ))}
      <style>{`
        @keyframes slideUp {
          from { transform: translateY(0.75rem); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
      `}</style>
    </div>
  )
}
