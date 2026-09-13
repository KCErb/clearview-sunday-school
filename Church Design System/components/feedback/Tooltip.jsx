import React from 'react';

export function Tooltip({ label, placement = 'top', children }) {
  const [on, setOn] = React.useState(false);
  const pos = placement === 'bottom' ? { top: '100%', marginTop: 8 } : { bottom: '100%', marginBottom: 8 };
  return <span style={{ position: 'relative', display: 'inline-flex' }} onMouseEnter={() => setOn(true)} onMouseLeave={() => setOn(false)} onFocus={() => setOn(true)} onBlur={() => setOn(false)}>
    {children}
    {on ? <span role="tooltip" style={{
      position: 'absolute', left: '50%', transform: 'translateX(-50%)', ...pos, zIndex: 40, whiteSpace: 'nowrap',
      background: 'var(--surface-invert)', color: 'var(--text-invert)', fontFamily: 'var(--font-sans)',
      fontSize: 'var(--fs-caption)', padding: '6px 10px', borderRadius: 'var(--radius-sm)', boxShadow: 'var(--shadow-md)',
    }}>{label}</span> : null}
  </span>;
}
