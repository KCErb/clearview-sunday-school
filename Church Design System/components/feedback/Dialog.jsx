import React from 'react';
import { IconButton } from '../core/IconButton.jsx';

export function Dialog({ open, title, onClose, footer, children, width = 520 }) {
  if (!open) return null;
  return <div role="dialog" aria-modal="true" aria-label={title} style={{ position: 'fixed', inset: 0, zIndex: 60, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 'var(--space-6)' }}>
    <div onClick={onClose} style={{ position: 'absolute', inset: 0, background: 'rgba(0,48,87,.52)', backdropFilter: 'var(--blur-veil)' }} />
    <div style={{ position: 'relative', width: '100%', maxWidth: width, background: 'var(--surface-card)', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-lg)', overflow: 'hidden' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 'var(--space-4)', padding: 'var(--space-5) var(--space-6)', borderBottom: 'var(--border-hairline) solid var(--border-subtle)' }}>
        <h3 style={{ fontSize: 'var(--fs-h4)', margin: 0 }}>{title}</h3>
        <IconButton name="x" label="Close" onClick={onClose} />
      </div>
      <div style={{ padding: 'var(--space-6)', fontSize: 'var(--fs-body)' }}>{children}</div>
      {footer ? <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-3)', padding: 'var(--space-5) var(--space-6)', background: 'var(--surface-page)', borderTop: 'var(--border-hairline) solid var(--border-subtle)' }}>{footer}</div> : null}
    </div>
  </div>;
}
