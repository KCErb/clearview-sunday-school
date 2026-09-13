import React from 'react';

const CDN = 'https://cdn.jsdelivr.net/npm/lucide-static@0.462.0/icons/';

/** Renders a Lucide glyph as a CSS mask so it inherits currentColor. */
export function Icon({ name, size = 20, strokeWidth, style, ...rest }) {
  const url = `url("${CDN}${name}.svg")`;
  return (
    <span role="presentation" aria-hidden="true" style={{
      display: 'inline-block', width: size, height: size, flex: '0 0 auto',
      backgroundColor: 'currentColor',
      WebkitMaskImage: url, maskImage: url,
      WebkitMaskRepeat: 'no-repeat', maskRepeat: 'no-repeat',
      WebkitMaskSize: 'contain', maskSize: 'contain',
      WebkitMaskPosition: 'center', maskPosition: 'center',
      ...style,
    }} {...rest} />
  );
}
