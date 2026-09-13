import React from 'react';
import { Icon } from '../core/Icon.jsx';

export function Checkbox({ label, description, checked, onChange, disabled, id }) {
  const uid = id || React.useId();
  return <label htmlFor={uid} style={{ display: 'flex', gap: 'var(--space-3)', alignItems: 'flex-start', cursor: disabled ? 'not-allowed' : 'pointer', opacity: disabled ? .6 : 1 }}>
    <input id={uid} type="checkbox" checked={checked} disabled={disabled} onChange={e => onChange && onChange(e.target.checked)} style={{ position: 'absolute', opacity: 0, width: 1, height: 1 }} />
    <span aria-hidden="true" style={{
      width: 18, height: 18, marginTop: 3, flex: '0 0 auto', display: 'flex', alignItems: 'center', justifyContent: 'center',
      borderRadius: 'var(--radius-xs)', color: 'var(--text-invert)',
      background: checked ? 'var(--accent)' : 'var(--surface-card)',
      border: `var(--border-hairline) solid ${checked ? 'var(--accent)' : 'var(--border-strong)'}`,
      transition: 'var(--transition-interactive)',
    }}>{checked ? <Icon name="check" size={13} /> : null}</span>
    <span>
      <span style={{ fontFamily: 'var(--font-serif-text)', fontSize: 'var(--fs-body)', color: 'var(--text-body)' }}>{label}</span>
      {description ? <span style={{ display: 'block', fontFamily: 'var(--font-sans)', fontSize: 'var(--fs-caption)', color: 'var(--text-muted)' }}>{description}</span> : null}
    </span>
  </label>;
}
