import React from 'react';
import { Icon } from '../core/Icon.jsx';

const tones = {
  note:     ['var(--blue-tint-10)',  'var(--blue-25)',  'info'],
  scripture:['var(--gold-10-tint-20)',  'var(--gold-20)',  'book-open'],
  caution:  ['var(--gold-10-tint-20)',  'var(--yellow-35)',  'triangle-alert'],
  critical: ['var(--gold-10-tint-20)', 'var(--yellow-35)', 'circle-alert'],
};

export function Callout({ tone = 'note', title, icon, children }) {
  const [bg, bd, defIcon] = tones[tone] || tones.note;
  return <div style={{ display: 'flex', gap: 'var(--space-4)', background: bg, borderLeft: `var(--border-heavy) solid ${bd}`, borderRadius: 'var(--radius-xs)', padding: 'var(--space-5) var(--space-6)' }}>
    <span style={{ color: bd, flex: '0 0 auto', marginTop: 2 }}><Icon name={icon || defIcon} size={20} /></span>
    <div>
      {title ? <div style={{ fontFamily: 'var(--font-sans)', fontWeight: 'var(--fw-semibold)', fontSize: 'var(--fs-body-sm)', color: 'var(--text-heading)', marginBottom: 'var(--space-1)' }}>{title}</div> : null}
      <div style={{ fontSize: 'var(--fs-body)', color: 'var(--text-body)', maxWidth: 'var(--measure-body)' }}>{children}</div>
    </div>
  </div>;
}
