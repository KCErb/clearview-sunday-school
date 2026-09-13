import React from 'react';
import { Icon } from '../core/Icon.jsx';

export function Breadcrumb({ items = [] }) {
  return <nav aria-label="Breadcrumb" style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', flexWrap: 'wrap', fontFamily: 'var(--font-sans)', fontSize: 'var(--fs-body-sm)' }}>
    {items.map((it, i) => {
      const last = i === items.length - 1;
      return <React.Fragment key={i}>
        {last ? <span style={{ color: 'var(--text-muted)' }}>{it.label ?? it}</span>
          : <a href={it.href || '#'} style={{ color: 'var(--link)' }}>{it.label ?? it}</a>}
        {last ? null : <span style={{ color: 'var(--gray-20)', display: 'flex' }}><Icon name="chevron-right" size={14} /></span>}
      </React.Fragment>;
    })}
  </nav>;
}
