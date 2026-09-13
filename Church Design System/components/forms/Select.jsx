import React from 'react';
import { Icon } from '../core/Icon.jsx';

export function Select({ label, hint, options = [], id, ...rest }) {
  const uid = id || React.useId();
  return <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
    {label ? <label htmlFor={uid} style={{ fontFamily: 'var(--font-sans)', fontSize: 'var(--fs-body-sm)', fontWeight: 'var(--fw-semibold)', color: 'var(--text-heading)' }}>{label}</label> : null}
    <div style={{ position: 'relative', display: 'flex' }}>
      <select id={uid} style={{
        appearance: 'none', width: '100%', fontFamily: 'var(--font-serif-text)', fontSize: 'var(--fs-body)',
        color: 'var(--text-body)', background: 'var(--surface-card)', padding: '10px 36px 10px 12px',
        border: 'var(--border-hairline) solid var(--border-default)', borderRadius: 'var(--radius-sm)',
      }} {...rest}>
        {options.map(o => <option key={o.value ?? o} value={o.value ?? o}>{o.label ?? o}</option>)}
      </select>
      <span style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none', display: 'flex' }}><Icon name="chevron-down" size={18} /></span>
    </div>
    {hint ? <span style={{ fontFamily: 'var(--font-sans)', fontSize: 'var(--fs-caption)', color: 'var(--text-muted)' }}>{hint}</span> : null}
  </div>;
}
