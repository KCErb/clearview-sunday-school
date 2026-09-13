import React from 'react';

/**
 * TYPE-ONLY NAME LOCKUP -- not the Church wordmark.
 * The official wordmark, symbol (Christus arch + cornerstone) and light-ray graphic are
 * trademarked assets released only to approved correlated channels. They are deliberately
 * NOT reproduced here. This component sets the name of the Church in approved type so
 * layouts have something correct to sit where a mark would otherwise go.
 */
export function Wordmark({ tone = 'ink', align = 'center', scale = 1 }) {
  const fg = tone === 'invert' ? 'var(--text-invert)' : 'var(--black)';
  const quiet = tone === 'invert' ? 'var(--text-invert-muted)' : 'var(--text-muted)';
  return <div style={{ display: 'inline-block', textAlign: align, fontFamily: 'var(--font-serif-display)', color: fg, lineHeight: 1.22 }}>
    <div style={{ fontSize: 13 * scale, letterSpacing: '.06em', color: quiet }}>THE CHURCH OF</div>
    <div style={{ fontSize: 26 * scale, fontWeight: 'var(--fw-semibold)', letterSpacing: '.01em' }}>JESUS CHRIST</div>
    <div style={{ fontSize: 13 * scale, letterSpacing: '.06em', color: quiet }}>OF LATTER-DAY SAINTS</div>
  </div>;
}
