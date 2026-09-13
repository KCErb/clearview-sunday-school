import React from 'react';

export function Input({ label, hint, error, id, type = 'text', multiline, rows = 4, ...rest }) {
  const uid = id || React.useId();
  const field = {
    width: '100%', boxSizing: 'border-box', fontFamily: 'var(--font-serif-text)', fontSize: 'var(--fs-body)',
    color: 'var(--text-body)', background: 'var(--surface-card)', padding: '10px 12px',
    border: `var(--border-hairline) solid ${error ? 'var(--status-critical)' : 'var(--border-default)'}`,
    borderRadius: 'var(--radius-sm)', transition: 'var(--transition-interactive)',
  };
  return <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
    {label ? <label htmlFor={uid} style={{ fontFamily: 'var(--font-sans)', fontSize: 'var(--fs-body-sm)', fontWeight: 'var(--fw-semibold)', color: 'var(--text-heading)' }}>{label}</label> : null}
    {multiline
      ? <textarea id={uid} rows={rows} style={{ ...field, resize: 'vertical' }} {...rest} />
      : <input id={uid} type={type} style={field} {...rest} />}
    {error ? <span style={{ fontFamily: 'var(--font-sans)', fontSize: 'var(--fs-caption)', color: 'var(--status-critical)' }}>{error}</span>
      : hint ? <span style={{ fontFamily: 'var(--font-sans)', fontSize: 'var(--fs-caption)', color: 'var(--text-muted)' }}>{hint}</span> : null}
  </div>;
}
