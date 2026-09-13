import React from 'react';

export function Radio({ name, options = [], value, onChange }) {
  return <div role="radiogroup" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
    {options.map(o => {
      const v = o.value ?? o, l = o.label ?? o, on = v === value;
      return <label key={v} style={{ display: 'flex', gap: 'var(--space-3)', alignItems: 'center', cursor: 'pointer' }}>
        <input type="radio" name={name} checked={on} onChange={() => onChange && onChange(v)} style={{ position: 'absolute', opacity: 0, width: 1, height: 1 }} />
        <span aria-hidden="true" style={{
          width: 18, height: 18, borderRadius: '50%', flex: '0 0 auto', display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: 'var(--surface-card)', border: `var(--border-hairline) solid ${on ? 'var(--accent)' : 'var(--border-strong)'}`,
          transition: 'var(--transition-interactive)',
        }}>{on ? <span style={{ width: 9, height: 9, borderRadius: '50%', background: 'var(--accent)' }} /> : null}</span>
        <span style={{ fontFamily: 'var(--font-serif-text)', fontSize: 'var(--fs-body)' }}>{l}</span>
      </label>;
    })}
  </div>;
}
