import React from 'react';

export function MediaFrame({ src, alt = '', ratio = '3 / 2', caption, credit, scrim }) {
  return <figure style={{ margin: 0 }}>
    <div style={{ position: 'relative', aspectRatio: ratio, background: 'var(--surface-sunken)', overflow: 'hidden', borderRadius: 'var(--radius-sm)' }}>
      {src ? <img src={src} alt={alt} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} /> : null}
      {scrim ? <div style={{ position: 'absolute', inset: 0, background: scrim === 'side' ? 'var(--scrim-full)' : 'var(--scrim-bottom)' }} /> : null}
    </div>
    {caption || credit ? <figcaption style={{ marginTop: 'var(--space-3)', fontFamily: 'var(--font-sans)', fontSize: 'var(--fs-caption)', color: 'var(--text-muted)', lineHeight: 1.5 }}>
      {caption ? <span style={{ color: 'var(--text-body)' }}>{caption}</span> : null}
      {caption && credit ? ' ' : null}
      {credit ? <span style={{ fontStyle: 'italic' }}>{credit}</span> : null}
    </figcaption> : null}
  </figure>;
}
