import React from 'react';

const tones = {
  neutral: ['var(--neutral-10)', 'var(--gray-40)'],
  accent: ['var(--blue-tint-20)', 'var(--blue-35)'],
  growth: ['var(--green-tint-20)', 'var(--green-35)'],
  warm: ['var(--gold-10-tint-20)', 'var(--yellow-35)'],
  solid: ['var(--accent)', 'var(--text-invert)'],
};

export function Badge({ tone = 'neutral', children, ...rest }) {
  const [bg, fg] = tones[tone] || tones.neutral;
  return <span style={{
    display: 'inline-block', background: bg, color: fg, fontFamily: 'var(--font-sans)',
    fontSize: 'var(--fs-overline)', fontWeight: 'var(--fw-semibold)', letterSpacing: 'var(--ls-overline)',
    textTransform: 'uppercase', padding: '4px 8px', borderRadius: 'var(--radius-xs)', lineHeight: 1.2,
  }} {...rest}>{children}</span>;
}
