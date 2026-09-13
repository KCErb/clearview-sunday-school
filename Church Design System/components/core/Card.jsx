import React from 'react';

export function Card({ elevation = 'flat', accent, padding = 'var(--space-6)', children, style, ...rest }) {
  const shadow = { flat: 'var(--shadow-none)', raised: 'var(--shadow-sm)', floating: 'var(--shadow-md)' }[elevation];
  return (
    <div style={{
      background: 'var(--surface-card)', border: 'var(--border-hairline) solid var(--border-subtle)',
      borderRadius: 'var(--radius-md)', boxShadow: shadow, padding, overflow: 'hidden',
      borderTop: accent ? `var(--border-heavy) solid var(--accent)` : undefined, ...style,
    }} {...rest}>{children}</div>
  );
}

export function CardMedia({ src, alt = '', ratio = '16 / 9' }) {
  return <div style={{ margin: 'calc(var(--space-6) * -1) calc(var(--space-6) * -1) var(--space-5)', aspectRatio: ratio, background: 'var(--surface-sunken)' }}>
    {src ? <img src={src} alt={alt} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} /> : null}
  </div>;
}
