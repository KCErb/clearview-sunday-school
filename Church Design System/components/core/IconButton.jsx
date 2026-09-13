import React from 'react';
import { Icon } from './Icon.jsx';

const box = { sm: 28, md: 36, lg: 44 };

export function IconButton({ name, label, size = 'md', variant = 'quiet', disabled, onClick, ...rest }) {
  const [hover, setHover] = React.useState(false);
  const bg = variant === 'filled'
    ? (hover ? 'var(--accent-hover)' : 'var(--accent)')
    : (hover ? 'var(--neutral-10)' : 'transparent');
  return (
    <button type="button" aria-label={label} disabled={disabled} onClick={onClick}
      onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}
      style={{
        width: box[size], height: box[size], display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
        border: 'none', borderRadius: 'var(--radius-sm)', background: disabled ? 'transparent' : bg,
        color: disabled ? 'var(--disabled-fg)' : variant === 'filled' ? 'var(--text-invert)' : 'var(--text-body)',
        cursor: disabled ? 'not-allowed' : 'pointer', transition: 'var(--transition-interactive)', padding: 0,
      }} {...rest}>
      <Icon name={name} size={size === 'lg' ? 22 : size === 'sm' ? 16 : 19} />
    </button>
  );
}
