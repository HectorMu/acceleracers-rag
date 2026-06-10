interface Props {
  text: string
}

export function StreamingText({ text }: Props) {
  return (
    <div style={{ paddingLeft: '3rem' }}>
      <span style={{ fontSize: '0.9rem', lineHeight: '1.6', whiteSpace: 'pre-wrap' }}>
        {text}
        <span className="cursor-blink" style={{ display: 'inline-block', width: '0.5rem', height: '1rem', background: 'var(--color-accent-1)', marginLeft: '0.1rem', verticalAlign: 'text-bottom' }} />
      </span>
    </div>
  )
}
