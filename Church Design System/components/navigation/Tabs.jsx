import React from 'react';

export function Tabs({ items = [], value, onChange }) {
  return <div role="tablist" style={{ display: 'flex', gap: 'var(--space-6)', borderBottom: 'var(--border-hairline) solid var(--border-subtle)' }}>
    {items.map(it => {
      const v = it.value ?? it, l = it.label ?? it, on = v === value;
      return <button key={v} role="tab" aria-selected={on} onClick={() => onChange && onChange(v)} style={{
        appearance: 'none', background: 'none', border: 'none', cursor: 'pointer', padding: '10px 0',
        fontFamily: 'var(--font-sans)', fontSize: 'var(--fs-body)', fontWeight: on ? 'var(--fw-semibold)' : 'var(--fw-regular)',
        color: on ? 'var(--text-heading)' : 'var(--text-muted)',
        boxShadow: on ? 'inset 0 -3px 0 0 var(--accent)' : 'none', transition: 'var(--transition-interactive)',
      }}>{l}</button>;
    })}
  </div>;
}
