import { useEffect, useState } from 'react'

interface Props {
  text: string
}

export function StreamingText({ text }: Props) {
  return (
    <div style={{ paddingLeft: '3rem' }}>
      <span style={{ fontSize: '0.9rem', lineHeight: '1.6', whiteSpace: 'pre-wrap' }}>
        {text}
        <span style={{ display: 'inline-block', width: '0.5rem', height: '1rem', background: 'var(--color-accent-1)', marginLeft: '0.1rem', animation: 'blink 0.8s step-end infinite', verticalAlign: 'text-bottom' }} />
      </span>
      <style>{`@keyframes blink { 50% { opacity: 0; } }`}</style>
    </div>
  )
}
