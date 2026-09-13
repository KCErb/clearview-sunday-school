import React from 'react';
import { Icon } from './Icon.jsx';

export function Tag({ children, onRemove, selected, onClick, ...rest }) {
  const interactive = !!onClick;
  return <span onClick={onClick} style={{
    display: 'inline-flex', alignItems: 'center', gap: 'var(--space-2)',
    fontFamily: 'var(--font-sans)', fontSize: 'var(--fs-body-sm)',
    background: selected ? 'var(--blue-tint-20)' : 'var(--surface-card)',
    color: selected ? 'var(--blue-35)' : 'var(--text-body)',
    border: `var(--border-hairline) solid ${selected ? 'var(--border-accent)' : 'var(--border-default)'}`,
    borderRadius: 'var(--radius-pill)', padding: '4px 12px', cursor: interactive ? 'pointer' : 'default',
    transition: 'var(--transition-interactive)',
  }} {...rest}>
    {children}
    {onRemove ? <span onClick={(e) => { e.stopPropagation(); onRemove(); }} style={{ display: 'inline-flex', cursor: 'pointer', color: 'var(--text-muted)' }}><Icon name="x" size={14} /></span> : null}
  </span>;
}
