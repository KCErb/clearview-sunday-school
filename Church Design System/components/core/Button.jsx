import React from 'react';

const pad = { sm: '6px 14px', md: '10px 20px', lg: '14px 28px' };
const size = { sm: 'var(--fs-body-sm)', md: 'var(--fs-body)', lg: 'var(--fs-body-lg)' };

export function Button({ variant = 'primary', size: s = 'md', disabled, fullWidth, iconBefore, iconAfter, children, onClick, type = 'button', ...rest }) {
  const [hover, setHover] = React.useState(false);
  const [press, setPress] = React.useState(false);
  const skins = {
    primary: { bg: press ? 'var(--accent-press)' : hover ? 'var(--accent-hover)' : 'var(--accent)', fg: 'var(--text-invert)', bd: 'transparent' },
    secondary: { bg: press ? 'var(--blue-5)' : hover ? 'var(--blue-tint-20)' : 'transparent', fg: 'var(--accent-hover)', bd: 'var(--accent)' },
    quiet: { bg: press ? 'var(--neutral-20)' : hover ? 'var(--neutral-10)' : 'transparent', fg: 'var(--text-body)', bd: 'transparent' },
    invert: { bg: press ? 'rgba(255,255,255,.82)' : hover ? 'rgba(255,255,255,.92)' : 'var(--white)', fg: 'var(--blue-40)', bd: 'transparent' },
  };
  const k = skins[variant] || skins.primary;
  return (
    <button type={type} disabled={disabled} onClick={onClick}
      onMouseEnter={() => setHover(true)} onMouseLeave={() => { setHover(false); setPress(false); }}
      onMouseDown={() => setPress(true)} onMouseUp={() => setPress(false)}
      style={{
        display: fullWidth ? 'flex' : 'inline-flex', width: fullWidth ? '100%' : 'auto',
        alignItems: 'center', justifyContent: 'center', gap: 'var(--space-2)',
        fontFamily: 'var(--font-sans)', fontWeight: 'var(--fw-semibold)', fontSize: size[s], lineHeight: 1.2,
        padding: pad[s], borderRadius: 'var(--radius-sm)',
        border: `var(--border-hairline) solid ${disabled ? 'transparent' : k.bd}`,
        background: disabled ? 'var(--disabled-bg)' : k.bg,
        color: disabled ? 'var(--disabled-fg)' : k.fg,
        cursor: disabled ? 'not-allowed' : 'pointer',
        transition: 'var(--transition-interactive)', textDecoration: 'none',
      }} {...rest}>
      {iconBefore}{children}{iconAfter}
    </button>
  );
}
