import React from 'react';

export function ScriptureBlock({ reference, size = 'md', tone = 'ink', children }) {
  const fs = { sm: 'var(--fs-body-lg)', md: 'var(--fs-h3)', lg: 'var(--fs-h1)' }[size];
  const invert = tone === 'invert';
  return <figure style={{ margin: 0, borderLeft: 'var(--border-medium) solid var(--gold-20)', paddingLeft: 'var(--space-6)', maxWidth: 'var(--measure-body)' }}>
    <blockquote style={{ margin: 0, fontFamily: 'var(--font-serif-text)', fontSize: fs, lineHeight: 1.45, fontStyle: 'italic', color: invert ? 'var(--text-invert)' : 'var(--text-heading)' }}>{children}</blockquote>
    {reference ? <figcaption style={{ marginTop: 'var(--space-4)', fontFamily: 'var(--font-sans)', fontSize: 'var(--fs-body-sm)', fontWeight: 'var(--fw-semibold)', letterSpacing: '.02em', color: invert ? 'var(--text-invert-muted)' : 'var(--text-muted)' }}>{reference}</figcaption> : null}
  </figure>;
}
