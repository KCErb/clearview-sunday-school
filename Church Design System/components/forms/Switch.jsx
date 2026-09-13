import React from 'react';

export function Switch({ label, checked, onChange, disabled }) {
  return <label style={{ display: 'inline-flex', alignItems: 'center', gap: 'var(--space-3)', cursor: disabled ? 'not-allowed' : 'pointer', opacity: disabled ? .6 : 1 }}>
    <button type="button" role="switch" aria-checked={!!checked} disabled={disabled} onClick={() => onChange && onChange(!checked)} style={{
      width: 44, height: 24, padding: 2, borderRadius: 'var(--radius-pill)', border: 'none',
      background: checked ? 'var(--accent)' : 'var(--neutral-25)', cursor: 'inherit',
      transition: 'background-color var(--dur-base) var(--ease-standard)', display: 'flex', alignItems: 'center',
    }}>
      <span style={{ width: 20, height: 20, borderRadius: '50%', background: 'var(--white)', boxShadow: 'var(--shadow-xs)', transform: checked ? 'translateX(20px)' : 'translateX(0)', transition: 'transform var(--dur-base) var(--ease-standard)' }} />
    </button>
    {label ? <span style={{ fontFamily: 'var(--font-serif-text)', fontSize: 'var(--fs-body)' }}>{label}</span> : null}
  </label>;
}
