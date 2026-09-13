import React from 'react';

export function Divider({ variant = 'hairline', align = 'left', style, ...rest }) {
  if (variant === 'rule') {
    return <hr style={{ border: 0, height: 3, width: 72, background: 'var(--slide-rule)', margin: align === 'center' ? '0 auto' : 0, ...style }} {...rest} />;
  }
  if (variant === 'ornament') {
    return <div aria-hidden="true" style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', justifyContent: align === 'center' ? 'center' : 'flex-start', color: 'var(--gold-20)', ...style }} {...rest}>
      <span style={{ height: 1, flex: 1, background: 'var(--border-subtle)' }} />
      <span style={{ width: 5, height: 5, transform: 'rotate(45deg)', background: 'currentColor' }} />
      <span style={{ height: 1, flex: 1, background: 'var(--border-subtle)' }} />
    </div>;
  }
  return <hr style={{ border: 0, borderTop: 'var(--border-hairline) solid var(--border-subtle)', margin: 0, ...style }} {...rest} />;
}
