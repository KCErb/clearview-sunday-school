import React from 'react';

export function PullQuote({ attribution, role, tone = 'ink', children }) {
  const invert = tone === 'invert';
  return <figure style={{ margin: 0, maxWidth: 'var(--measure-short)' }}>
    <blockquote style={{ margin: 0, fontFamily: 'var(--font-serif-display)', fontSize: 'var(--fs-h2)', lineHeight: 1.3, fontWeight: 'var(--fw-regular)', color: invert ? 'var(--text-invert)' : 'var(--text-heading)', textWrap: 'pretty' }}>{children}</blockquote>
    {attribution ? <figcaption style={{ marginTop: 'var(--space-5)', fontFamily: 'var(--font-sans)', fontSize: 'var(--fs-body-sm)', color: invert ? 'var(--text-invert-muted)' : 'var(--text-muted)' }}>
      <span style={{ fontWeight: 'var(--fw-semibold)', color: invert ? 'var(--text-invert)' : 'var(--text-body)' }}>{attribution}</span>{role ? `  ·  ${role}` : ''}
    </figcaption> : null}
  </figure>;
}
