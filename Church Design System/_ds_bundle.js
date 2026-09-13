/* @ds-bundle: {"format":4,"namespace":"LatterDaySaintsDesignSystem_88d7f2","components":[{"name":"MediaFrame","sourcePath":"components/brand/MediaFrame.jsx"},{"name":"PullQuote","sourcePath":"components/brand/PullQuote.jsx"},{"name":"ScriptureBlock","sourcePath":"components/brand/ScriptureBlock.jsx"},{"name":"Wordmark","sourcePath":"components/brand/Wordmark.jsx"},{"name":"Badge","sourcePath":"components/core/Badge.jsx"},{"name":"Button","sourcePath":"components/core/Button.jsx"},{"name":"Card","sourcePath":"components/core/Card.jsx"},{"name":"CardMedia","sourcePath":"components/core/Card.jsx"},{"name":"Divider","sourcePath":"components/core/Divider.jsx"},{"name":"Icon","sourcePath":"components/core/Icon.jsx"},{"name":"IconButton","sourcePath":"components/core/IconButton.jsx"},{"name":"Tag","sourcePath":"components/core/Tag.jsx"},{"name":"Callout","sourcePath":"components/feedback/Callout.jsx"},{"name":"Dialog","sourcePath":"components/feedback/Dialog.jsx"},{"name":"Tooltip","sourcePath":"components/feedback/Tooltip.jsx"},{"name":"Checkbox","sourcePath":"components/forms/Checkbox.jsx"},{"name":"Input","sourcePath":"components/forms/Input.jsx"},{"name":"Radio","sourcePath":"components/forms/Radio.jsx"},{"name":"Select","sourcePath":"components/forms/Select.jsx"},{"name":"Switch","sourcePath":"components/forms/Switch.jsx"},{"name":"Breadcrumb","sourcePath":"components/navigation/Breadcrumb.jsx"},{"name":"Tabs","sourcePath":"components/navigation/Tabs.jsx"}],"sourceHashes":{"components/brand/MediaFrame.jsx":"48194892e1a4","components/brand/PullQuote.jsx":"eb5d2b818e71","components/brand/ScriptureBlock.jsx":"f2fbcaae0de9","components/brand/Wordmark.jsx":"256883582881","components/core/Badge.jsx":"707679a07c38","components/core/Button.jsx":"c670cf1f65bf","components/core/Card.jsx":"feb0f5376af0","components/core/Divider.jsx":"0f56bbea4d81","components/core/Icon.jsx":"6025dae147ab","components/core/IconButton.jsx":"58788583d8cf","components/core/Tag.jsx":"1101bfa697fa","components/feedback/Callout.jsx":"257db1bc7957","components/feedback/Dialog.jsx":"469302e7f17f","components/feedback/Tooltip.jsx":"7a95ed230e80","components/forms/Checkbox.jsx":"e33b8e8e1d02","components/forms/Input.jsx":"aad9154b53d6","components/forms/Radio.jsx":"4d62365b6773","components/forms/Select.jsx":"1c7dc41f712d","components/forms/Switch.jsx":"b0471638e192","components/navigation/Breadcrumb.jsx":"f3654d8739c9","components/navigation/Tabs.jsx":"c97c210d8049"},"inlinedExternals":[],"unexposedExports":[]} */

(() => {

const __ds_ns = (window.LatterDaySaintsDesignSystem_88d7f2 = window.LatterDaySaintsDesignSystem_88d7f2 || {});

const __ds_scope = {};

(__ds_ns.__errors = __ds_ns.__errors || []);

// components/brand/MediaFrame.jsx
try { (() => {
function MediaFrame({
  src,
  alt = '',
  ratio = '3 / 2',
  caption,
  credit,
  scrim
}) {
  return /*#__PURE__*/React.createElement("figure", {
    style: {
      margin: 0
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'relative',
      aspectRatio: ratio,
      background: 'var(--surface-sunken)',
      overflow: 'hidden',
      borderRadius: 'var(--radius-sm)'
    }
  }, src ? /*#__PURE__*/React.createElement("img", {
    src: src,
    alt: alt,
    style: {
      width: '100%',
      height: '100%',
      objectFit: 'cover',
      display: 'block'
    }
  }) : null, scrim ? /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      inset: 0,
      background: scrim === 'side' ? 'var(--scrim-full)' : 'var(--scrim-bottom)'
    }
  }) : null), caption || credit ? /*#__PURE__*/React.createElement("figcaption", {
    style: {
      marginTop: 'var(--space-3)',
      fontFamily: 'var(--font-sans)',
      fontSize: 'var(--fs-caption)',
      color: 'var(--text-muted)',
      lineHeight: 1.5
    }
  }, caption ? /*#__PURE__*/React.createElement("span", {
    style: {
      color: 'var(--text-body)'
    }
  }, caption) : null, caption && credit ? ' ' : null, credit ? /*#__PURE__*/React.createElement("span", {
    style: {
      fontStyle: 'italic'
    }
  }, credit) : null) : null);
}
Object.assign(__ds_scope, { MediaFrame });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/brand/MediaFrame.jsx", error: String((e && e.message) || e) }); }

// components/brand/PullQuote.jsx
try { (() => {
function PullQuote({
  attribution,
  role,
  tone = 'ink',
  children
}) {
  const invert = tone === 'invert';
  return /*#__PURE__*/React.createElement("figure", {
    style: {
      margin: 0,
      maxWidth: 'var(--measure-short)'
    }
  }, /*#__PURE__*/React.createElement("blockquote", {
    style: {
      margin: 0,
      fontFamily: 'var(--font-serif-display)',
      fontSize: 'var(--fs-h2)',
      lineHeight: 1.3,
      fontWeight: 'var(--fw-regular)',
      color: invert ? 'var(--text-invert)' : 'var(--text-heading)',
      textWrap: 'pretty'
    }
  }, children), attribution ? /*#__PURE__*/React.createElement("figcaption", {
    style: {
      marginTop: 'var(--space-5)',
      fontFamily: 'var(--font-sans)',
      fontSize: 'var(--fs-body-sm)',
      color: invert ? 'var(--text-invert-muted)' : 'var(--text-muted)'
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontWeight: 'var(--fw-semibold)',
      color: invert ? 'var(--text-invert)' : 'var(--text-body)'
    }
  }, attribution), role ? `  ·  ${role}` : '') : null);
}
Object.assign(__ds_scope, { PullQuote });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/brand/PullQuote.jsx", error: String((e && e.message) || e) }); }

// components/brand/ScriptureBlock.jsx
try { (() => {
function ScriptureBlock({
  reference,
  size = 'md',
  tone = 'ink',
  children
}) {
  const fs = {
    sm: 'var(--fs-body-lg)',
    md: 'var(--fs-h3)',
    lg: 'var(--fs-h1)'
  }[size];
  const invert = tone === 'invert';
  return /*#__PURE__*/React.createElement("figure", {
    style: {
      margin: 0,
      borderLeft: 'var(--border-medium) solid var(--gold-20)',
      paddingLeft: 'var(--space-6)',
      maxWidth: 'var(--measure-body)'
    }
  }, /*#__PURE__*/React.createElement("blockquote", {
    style: {
      margin: 0,
      fontFamily: 'var(--font-serif-text)',
      fontSize: fs,
      lineHeight: 1.45,
      fontStyle: 'italic',
      color: invert ? 'var(--text-invert)' : 'var(--text-heading)'
    }
  }, children), reference ? /*#__PURE__*/React.createElement("figcaption", {
    style: {
      marginTop: 'var(--space-4)',
      fontFamily: 'var(--font-sans)',
      fontSize: 'var(--fs-body-sm)',
      fontWeight: 'var(--fw-semibold)',
      letterSpacing: '.02em',
      color: invert ? 'var(--text-invert-muted)' : 'var(--text-muted)'
    }
  }, reference) : null);
}
Object.assign(__ds_scope, { ScriptureBlock });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/brand/ScriptureBlock.jsx", error: String((e && e.message) || e) }); }

// components/brand/Wordmark.jsx
try { (() => {
/**
 * TYPE-ONLY NAME LOCKUP -- not the Church wordmark.
 * The official wordmark, symbol (Christus arch + cornerstone) and light-ray graphic are
 * trademarked assets released only to approved correlated channels. They are deliberately
 * NOT reproduced here. This component sets the name of the Church in approved type so
 * layouts have something correct to sit where a mark would otherwise go.
 */
function Wordmark({
  tone = 'ink',
  align = 'center',
  scale = 1
}) {
  const fg = tone === 'invert' ? 'var(--text-invert)' : 'var(--black)';
  const quiet = tone === 'invert' ? 'var(--text-invert-muted)' : 'var(--text-muted)';
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'inline-block',
      textAlign: align,
      fontFamily: 'var(--font-serif-display)',
      color: fg,
      lineHeight: 1.22
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 13 * scale,
      letterSpacing: '.06em',
      color: quiet
    }
  }, "THE CHURCH OF"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 26 * scale,
      fontWeight: 'var(--fw-semibold)',
      letterSpacing: '.01em'
    }
  }, "JESUS CHRIST"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 13 * scale,
      letterSpacing: '.06em',
      color: quiet
    }
  }, "OF LATTER-DAY SAINTS"));
}
Object.assign(__ds_scope, { Wordmark });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/brand/Wordmark.jsx", error: String((e && e.message) || e) }); }

// components/core/Badge.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
const tones = {
  neutral: ['var(--neutral-10)', 'var(--gray-40)'],
  accent: ['var(--blue-tint-20)', 'var(--blue-35)'],
  growth: ['var(--green-tint-20)', 'var(--green-35)'],
  warm: ['var(--gold-10-tint-20)', 'var(--yellow-35)'],
  solid: ['var(--accent)', 'var(--text-invert)']
};
function Badge({
  tone = 'neutral',
  children,
  ...rest
}) {
  const [bg, fg] = tones[tone] || tones.neutral;
  return /*#__PURE__*/React.createElement("span", _extends({
    style: {
      display: 'inline-block',
      background: bg,
      color: fg,
      fontFamily: 'var(--font-sans)',
      fontSize: 'var(--fs-overline)',
      fontWeight: 'var(--fw-semibold)',
      letterSpacing: 'var(--ls-overline)',
      textTransform: 'uppercase',
      padding: '4px 8px',
      borderRadius: 'var(--radius-xs)',
      lineHeight: 1.2
    }
  }, rest), children);
}
Object.assign(__ds_scope, { Badge });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/Badge.jsx", error: String((e && e.message) || e) }); }

// components/core/Button.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
const pad = {
  sm: '6px 14px',
  md: '10px 20px',
  lg: '14px 28px'
};
const size = {
  sm: 'var(--fs-body-sm)',
  md: 'var(--fs-body)',
  lg: 'var(--fs-body-lg)'
};
function Button({
  variant = 'primary',
  size: s = 'md',
  disabled,
  fullWidth,
  iconBefore,
  iconAfter,
  children,
  onClick,
  type = 'button',
  ...rest
}) {
  const [hover, setHover] = React.useState(false);
  const [press, setPress] = React.useState(false);
  const skins = {
    primary: {
      bg: press ? 'var(--accent-press)' : hover ? 'var(--accent-hover)' : 'var(--accent)',
      fg: 'var(--text-invert)',
      bd: 'transparent'
    },
    secondary: {
      bg: press ? 'var(--blue-5)' : hover ? 'var(--blue-tint-20)' : 'transparent',
      fg: 'var(--accent-hover)',
      bd: 'var(--accent)'
    },
    quiet: {
      bg: press ? 'var(--neutral-20)' : hover ? 'var(--neutral-10)' : 'transparent',
      fg: 'var(--text-body)',
      bd: 'transparent'
    },
    invert: {
      bg: press ? 'rgba(255,255,255,.82)' : hover ? 'rgba(255,255,255,.92)' : 'var(--white)',
      fg: 'var(--blue-40)',
      bd: 'transparent'
    }
  };
  const k = skins[variant] || skins.primary;
  return /*#__PURE__*/React.createElement("button", _extends({
    type: type,
    disabled: disabled,
    onClick: onClick,
    onMouseEnter: () => setHover(true),
    onMouseLeave: () => {
      setHover(false);
      setPress(false);
    },
    onMouseDown: () => setPress(true),
    onMouseUp: () => setPress(false),
    style: {
      display: fullWidth ? 'flex' : 'inline-flex',
      width: fullWidth ? '100%' : 'auto',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 'var(--space-2)',
      fontFamily: 'var(--font-sans)',
      fontWeight: 'var(--fw-semibold)',
      fontSize: size[s],
      lineHeight: 1.2,
      padding: pad[s],
      borderRadius: 'var(--radius-sm)',
      border: `var(--border-hairline) solid ${disabled ? 'transparent' : k.bd}`,
      background: disabled ? 'var(--disabled-bg)' : k.bg,
      color: disabled ? 'var(--disabled-fg)' : k.fg,
      cursor: disabled ? 'not-allowed' : 'pointer',
      transition: 'var(--transition-interactive)',
      textDecoration: 'none'
    }
  }, rest), iconBefore, children, iconAfter);
}
Object.assign(__ds_scope, { Button });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/Button.jsx", error: String((e && e.message) || e) }); }

// components/core/Card.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
function Card({
  elevation = 'flat',
  accent,
  padding = 'var(--space-6)',
  children,
  style,
  ...rest
}) {
  const shadow = {
    flat: 'var(--shadow-none)',
    raised: 'var(--shadow-sm)',
    floating: 'var(--shadow-md)'
  }[elevation];
  return /*#__PURE__*/React.createElement("div", _extends({
    style: {
      background: 'var(--surface-card)',
      border: 'var(--border-hairline) solid var(--border-subtle)',
      borderRadius: 'var(--radius-md)',
      boxShadow: shadow,
      padding,
      overflow: 'hidden',
      borderTop: accent ? `var(--border-heavy) solid var(--accent)` : undefined,
      ...style
    }
  }, rest), children);
}
function CardMedia({
  src,
  alt = '',
  ratio = '16 / 9'
}) {
  return /*#__PURE__*/React.createElement("div", {
    style: {
      margin: 'calc(var(--space-6) * -1) calc(var(--space-6) * -1) var(--space-5)',
      aspectRatio: ratio,
      background: 'var(--surface-sunken)'
    }
  }, src ? /*#__PURE__*/React.createElement("img", {
    src: src,
    alt: alt,
    style: {
      width: '100%',
      height: '100%',
      objectFit: 'cover',
      display: 'block'
    }
  }) : null);
}
Object.assign(__ds_scope, { Card, CardMedia });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/Card.jsx", error: String((e && e.message) || e) }); }

// components/core/Divider.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
function Divider({
  variant = 'hairline',
  align = 'left',
  style,
  ...rest
}) {
  if (variant === 'rule') {
    return /*#__PURE__*/React.createElement("hr", _extends({
      style: {
        border: 0,
        height: 3,
        width: 72,
        background: 'var(--slide-rule)',
        margin: align === 'center' ? '0 auto' : 0,
        ...style
      }
    }, rest));
  }
  if (variant === 'ornament') {
    return /*#__PURE__*/React.createElement("div", _extends({
      "aria-hidden": "true",
      style: {
        display: 'flex',
        alignItems: 'center',
        gap: 'var(--space-3)',
        justifyContent: align === 'center' ? 'center' : 'flex-start',
        color: 'var(--gold-20)',
        ...style
      }
    }, rest), /*#__PURE__*/React.createElement("span", {
      style: {
        height: 1,
        flex: 1,
        background: 'var(--border-subtle)'
      }
    }), /*#__PURE__*/React.createElement("span", {
      style: {
        width: 5,
        height: 5,
        transform: 'rotate(45deg)',
        background: 'currentColor'
      }
    }), /*#__PURE__*/React.createElement("span", {
      style: {
        height: 1,
        flex: 1,
        background: 'var(--border-subtle)'
      }
    }));
  }
  return /*#__PURE__*/React.createElement("hr", _extends({
    style: {
      border: 0,
      borderTop: 'var(--border-hairline) solid var(--border-subtle)',
      margin: 0,
      ...style
    }
  }, rest));
}
Object.assign(__ds_scope, { Divider });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/Divider.jsx", error: String((e && e.message) || e) }); }

// components/core/Icon.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
const CDN = 'https://cdn.jsdelivr.net/npm/lucide-static@0.462.0/icons/';

/** Renders a Lucide glyph as a CSS mask so it inherits currentColor. */
function Icon({
  name,
  size = 20,
  strokeWidth,
  style,
  ...rest
}) {
  const url = `url("${CDN}${name}.svg")`;
  return /*#__PURE__*/React.createElement("span", _extends({
    role: "presentation",
    "aria-hidden": "true",
    style: {
      display: 'inline-block',
      width: size,
      height: size,
      flex: '0 0 auto',
      backgroundColor: 'currentColor',
      WebkitMaskImage: url,
      maskImage: url,
      WebkitMaskRepeat: 'no-repeat',
      maskRepeat: 'no-repeat',
      WebkitMaskSize: 'contain',
      maskSize: 'contain',
      WebkitMaskPosition: 'center',
      maskPosition: 'center',
      ...style
    }
  }, rest));
}
Object.assign(__ds_scope, { Icon });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/Icon.jsx", error: String((e && e.message) || e) }); }

// components/core/IconButton.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
const box = {
  sm: 28,
  md: 36,
  lg: 44
};
function IconButton({
  name,
  label,
  size = 'md',
  variant = 'quiet',
  disabled,
  onClick,
  ...rest
}) {
  const [hover, setHover] = React.useState(false);
  const bg = variant === 'filled' ? hover ? 'var(--accent-hover)' : 'var(--accent)' : hover ? 'var(--neutral-10)' : 'transparent';
  return /*#__PURE__*/React.createElement("button", _extends({
    type: "button",
    "aria-label": label,
    disabled: disabled,
    onClick: onClick,
    onMouseEnter: () => setHover(true),
    onMouseLeave: () => setHover(false),
    style: {
      width: box[size],
      height: box[size],
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      border: 'none',
      borderRadius: 'var(--radius-sm)',
      background: disabled ? 'transparent' : bg,
      color: disabled ? 'var(--disabled-fg)' : variant === 'filled' ? 'var(--text-invert)' : 'var(--text-body)',
      cursor: disabled ? 'not-allowed' : 'pointer',
      transition: 'var(--transition-interactive)',
      padding: 0
    }
  }, rest), /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: name,
    size: size === 'lg' ? 22 : size === 'sm' ? 16 : 19
  }));
}
Object.assign(__ds_scope, { IconButton });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/IconButton.jsx", error: String((e && e.message) || e) }); }

// components/core/Tag.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
function Tag({
  children,
  onRemove,
  selected,
  onClick,
  ...rest
}) {
  const interactive = !!onClick;
  return /*#__PURE__*/React.createElement("span", _extends({
    onClick: onClick,
    style: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: 'var(--space-2)',
      fontFamily: 'var(--font-sans)',
      fontSize: 'var(--fs-body-sm)',
      background: selected ? 'var(--blue-tint-20)' : 'var(--surface-card)',
      color: selected ? 'var(--blue-35)' : 'var(--text-body)',
      border: `var(--border-hairline) solid ${selected ? 'var(--border-accent)' : 'var(--border-default)'}`,
      borderRadius: 'var(--radius-pill)',
      padding: '4px 12px',
      cursor: interactive ? 'pointer' : 'default',
      transition: 'var(--transition-interactive)'
    }
  }, rest), children, onRemove ? /*#__PURE__*/React.createElement("span", {
    onClick: e => {
      e.stopPropagation();
      onRemove();
    },
    style: {
      display: 'inline-flex',
      cursor: 'pointer',
      color: 'var(--text-muted)'
    }
  }, /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: "x",
    size: 14
  })) : null);
}
Object.assign(__ds_scope, { Tag });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/Tag.jsx", error: String((e && e.message) || e) }); }

// components/feedback/Callout.jsx
try { (() => {
const tones = {
  note: ['var(--blue-tint-10)', 'var(--blue-25)', 'info'],
  scripture: ['var(--gold-10-tint-20)', 'var(--gold-20)', 'book-open'],
  caution: ['var(--gold-10-tint-20)', 'var(--yellow-35)', 'triangle-alert'],
  critical: ['var(--gold-10-tint-20)', 'var(--yellow-35)', 'circle-alert']
};
function Callout({
  tone = 'note',
  title,
  icon,
  children
}) {
  const [bg, bd, defIcon] = tones[tone] || tones.note;
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 'var(--space-4)',
      background: bg,
      borderLeft: `var(--border-heavy) solid ${bd}`,
      borderRadius: 'var(--radius-xs)',
      padding: 'var(--space-5) var(--space-6)'
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      color: bd,
      flex: '0 0 auto',
      marginTop: 2
    }
  }, /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: icon || defIcon,
    size: 20
  })), /*#__PURE__*/React.createElement("div", null, title ? /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: 'var(--font-sans)',
      fontWeight: 'var(--fw-semibold)',
      fontSize: 'var(--fs-body-sm)',
      color: 'var(--text-heading)',
      marginBottom: 'var(--space-1)'
    }
  }, title) : null, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 'var(--fs-body)',
      color: 'var(--text-body)',
      maxWidth: 'var(--measure-body)'
    }
  }, children)));
}
Object.assign(__ds_scope, { Callout });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/feedback/Callout.jsx", error: String((e && e.message) || e) }); }

// components/feedback/Dialog.jsx
try { (() => {
function Dialog({
  open,
  title,
  onClose,
  footer,
  children,
  width = 520
}) {
  if (!open) return null;
  return /*#__PURE__*/React.createElement("div", {
    role: "dialog",
    "aria-modal": "true",
    "aria-label": title,
    style: {
      position: 'fixed',
      inset: 0,
      zIndex: 60,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 'var(--space-6)'
    }
  }, /*#__PURE__*/React.createElement("div", {
    onClick: onClose,
    style: {
      position: 'absolute',
      inset: 0,
      background: 'rgba(0,48,87,.52)',
      backdropFilter: 'var(--blur-veil)'
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'relative',
      width: '100%',
      maxWidth: width,
      background: 'var(--surface-card)',
      borderRadius: 'var(--radius-lg)',
      boxShadow: 'var(--shadow-lg)',
      overflow: 'hidden'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 'var(--space-4)',
      padding: 'var(--space-5) var(--space-6)',
      borderBottom: 'var(--border-hairline) solid var(--border-subtle)'
    }
  }, /*#__PURE__*/React.createElement("h3", {
    style: {
      fontSize: 'var(--fs-h4)',
      margin: 0
    }
  }, title), /*#__PURE__*/React.createElement(__ds_scope.IconButton, {
    name: "x",
    label: "Close",
    onClick: onClose
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      padding: 'var(--space-6)',
      fontSize: 'var(--fs-body)'
    }
  }, children), footer ? /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      justifyContent: 'flex-end',
      gap: 'var(--space-3)',
      padding: 'var(--space-5) var(--space-6)',
      background: 'var(--surface-page)',
      borderTop: 'var(--border-hairline) solid var(--border-subtle)'
    }
  }, footer) : null));
}
Object.assign(__ds_scope, { Dialog });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/feedback/Dialog.jsx", error: String((e && e.message) || e) }); }

// components/feedback/Tooltip.jsx
try { (() => {
function Tooltip({
  label,
  placement = 'top',
  children
}) {
  const [on, setOn] = React.useState(false);
  const pos = placement === 'bottom' ? {
    top: '100%',
    marginTop: 8
  } : {
    bottom: '100%',
    marginBottom: 8
  };
  return /*#__PURE__*/React.createElement("span", {
    style: {
      position: 'relative',
      display: 'inline-flex'
    },
    onMouseEnter: () => setOn(true),
    onMouseLeave: () => setOn(false),
    onFocus: () => setOn(true),
    onBlur: () => setOn(false)
  }, children, on ? /*#__PURE__*/React.createElement("span", {
    role: "tooltip",
    style: {
      position: 'absolute',
      left: '50%',
      transform: 'translateX(-50%)',
      ...pos,
      zIndex: 40,
      whiteSpace: 'nowrap',
      background: 'var(--surface-invert)',
      color: 'var(--text-invert)',
      fontFamily: 'var(--font-sans)',
      fontSize: 'var(--fs-caption)',
      padding: '6px 10px',
      borderRadius: 'var(--radius-sm)',
      boxShadow: 'var(--shadow-md)'
    }
  }, label) : null);
}
Object.assign(__ds_scope, { Tooltip });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/feedback/Tooltip.jsx", error: String((e && e.message) || e) }); }

// components/forms/Checkbox.jsx
try { (() => {
function Checkbox({
  label,
  description,
  checked,
  onChange,
  disabled,
  id
}) {
  const uid = id || React.useId();
  return /*#__PURE__*/React.createElement("label", {
    htmlFor: uid,
    style: {
      display: 'flex',
      gap: 'var(--space-3)',
      alignItems: 'flex-start',
      cursor: disabled ? 'not-allowed' : 'pointer',
      opacity: disabled ? .6 : 1
    }
  }, /*#__PURE__*/React.createElement("input", {
    id: uid,
    type: "checkbox",
    checked: checked,
    disabled: disabled,
    onChange: e => onChange && onChange(e.target.checked),
    style: {
      position: 'absolute',
      opacity: 0,
      width: 1,
      height: 1
    }
  }), /*#__PURE__*/React.createElement("span", {
    "aria-hidden": "true",
    style: {
      width: 18,
      height: 18,
      marginTop: 3,
      flex: '0 0 auto',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: 'var(--radius-xs)',
      color: 'var(--text-invert)',
      background: checked ? 'var(--accent)' : 'var(--surface-card)',
      border: `var(--border-hairline) solid ${checked ? 'var(--accent)' : 'var(--border-strong)'}`,
      transition: 'var(--transition-interactive)'
    }
  }, checked ? /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: "check",
    size: 13
  }) : null), /*#__PURE__*/React.createElement("span", null, /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: 'var(--font-serif-text)',
      fontSize: 'var(--fs-body)',
      color: 'var(--text-body)'
    }
  }, label), description ? /*#__PURE__*/React.createElement("span", {
    style: {
      display: 'block',
      fontFamily: 'var(--font-sans)',
      fontSize: 'var(--fs-caption)',
      color: 'var(--text-muted)'
    }
  }, description) : null));
}
Object.assign(__ds_scope, { Checkbox });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/forms/Checkbox.jsx", error: String((e && e.message) || e) }); }

// components/forms/Input.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
function Input({
  label,
  hint,
  error,
  id,
  type = 'text',
  multiline,
  rows = 4,
  ...rest
}) {
  const uid = id || React.useId();
  const field = {
    width: '100%',
    boxSizing: 'border-box',
    fontFamily: 'var(--font-serif-text)',
    fontSize: 'var(--fs-body)',
    color: 'var(--text-body)',
    background: 'var(--surface-card)',
    padding: '10px 12px',
    border: `var(--border-hairline) solid ${error ? 'var(--status-critical)' : 'var(--border-default)'}`,
    borderRadius: 'var(--radius-sm)',
    transition: 'var(--transition-interactive)'
  };
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 'var(--space-2)'
    }
  }, label ? /*#__PURE__*/React.createElement("label", {
    htmlFor: uid,
    style: {
      fontFamily: 'var(--font-sans)',
      fontSize: 'var(--fs-body-sm)',
      fontWeight: 'var(--fw-semibold)',
      color: 'var(--text-heading)'
    }
  }, label) : null, multiline ? /*#__PURE__*/React.createElement("textarea", _extends({
    id: uid,
    rows: rows,
    style: {
      ...field,
      resize: 'vertical'
    }
  }, rest)) : /*#__PURE__*/React.createElement("input", _extends({
    id: uid,
    type: type,
    style: field
  }, rest)), error ? /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: 'var(--font-sans)',
      fontSize: 'var(--fs-caption)',
      color: 'var(--status-critical)'
    }
  }, error) : hint ? /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: 'var(--font-sans)',
      fontSize: 'var(--fs-caption)',
      color: 'var(--text-muted)'
    }
  }, hint) : null);
}
Object.assign(__ds_scope, { Input });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/forms/Input.jsx", error: String((e && e.message) || e) }); }

// components/forms/Radio.jsx
try { (() => {
function Radio({
  name,
  options = [],
  value,
  onChange
}) {
  return /*#__PURE__*/React.createElement("div", {
    role: "radiogroup",
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 'var(--space-3)'
    }
  }, options.map(o => {
    const v = o.value ?? o,
      l = o.label ?? o,
      on = v === value;
    return /*#__PURE__*/React.createElement("label", {
      key: v,
      style: {
        display: 'flex',
        gap: 'var(--space-3)',
        alignItems: 'center',
        cursor: 'pointer'
      }
    }, /*#__PURE__*/React.createElement("input", {
      type: "radio",
      name: name,
      checked: on,
      onChange: () => onChange && onChange(v),
      style: {
        position: 'absolute',
        opacity: 0,
        width: 1,
        height: 1
      }
    }), /*#__PURE__*/React.createElement("span", {
      "aria-hidden": "true",
      style: {
        width: 18,
        height: 18,
        borderRadius: '50%',
        flex: '0 0 auto',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'var(--surface-card)',
        border: `var(--border-hairline) solid ${on ? 'var(--accent)' : 'var(--border-strong)'}`,
        transition: 'var(--transition-interactive)'
      }
    }, on ? /*#__PURE__*/React.createElement("span", {
      style: {
        width: 9,
        height: 9,
        borderRadius: '50%',
        background: 'var(--accent)'
      }
    }) : null), /*#__PURE__*/React.createElement("span", {
      style: {
        fontFamily: 'var(--font-serif-text)',
        fontSize: 'var(--fs-body)'
      }
    }, l));
  }));
}
Object.assign(__ds_scope, { Radio });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/forms/Radio.jsx", error: String((e && e.message) || e) }); }

// components/forms/Select.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
function Select({
  label,
  hint,
  options = [],
  id,
  ...rest
}) {
  const uid = id || React.useId();
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 'var(--space-2)'
    }
  }, label ? /*#__PURE__*/React.createElement("label", {
    htmlFor: uid,
    style: {
      fontFamily: 'var(--font-sans)',
      fontSize: 'var(--fs-body-sm)',
      fontWeight: 'var(--fw-semibold)',
      color: 'var(--text-heading)'
    }
  }, label) : null, /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'relative',
      display: 'flex'
    }
  }, /*#__PURE__*/React.createElement("select", _extends({
    id: uid,
    style: {
      appearance: 'none',
      width: '100%',
      fontFamily: 'var(--font-serif-text)',
      fontSize: 'var(--fs-body)',
      color: 'var(--text-body)',
      background: 'var(--surface-card)',
      padding: '10px 36px 10px 12px',
      border: 'var(--border-hairline) solid var(--border-default)',
      borderRadius: 'var(--radius-sm)'
    }
  }, rest), options.map(o => /*#__PURE__*/React.createElement("option", {
    key: o.value ?? o,
    value: o.value ?? o
  }, o.label ?? o))), /*#__PURE__*/React.createElement("span", {
    style: {
      position: 'absolute',
      right: 12,
      top: '50%',
      transform: 'translateY(-50%)',
      color: 'var(--text-muted)',
      pointerEvents: 'none',
      display: 'flex'
    }
  }, /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: "chevron-down",
    size: 18
  }))), hint ? /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: 'var(--font-sans)',
      fontSize: 'var(--fs-caption)',
      color: 'var(--text-muted)'
    }
  }, hint) : null);
}
Object.assign(__ds_scope, { Select });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/forms/Select.jsx", error: String((e && e.message) || e) }); }

// components/forms/Switch.jsx
try { (() => {
function Switch({
  label,
  checked,
  onChange,
  disabled
}) {
  return /*#__PURE__*/React.createElement("label", {
    style: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: 'var(--space-3)',
      cursor: disabled ? 'not-allowed' : 'pointer',
      opacity: disabled ? .6 : 1
    }
  }, /*#__PURE__*/React.createElement("button", {
    type: "button",
    role: "switch",
    "aria-checked": !!checked,
    disabled: disabled,
    onClick: () => onChange && onChange(!checked),
    style: {
      width: 44,
      height: 24,
      padding: 2,
      borderRadius: 'var(--radius-pill)',
      border: 'none',
      background: checked ? 'var(--accent)' : 'var(--neutral-25)',
      cursor: 'inherit',
      transition: 'background-color var(--dur-base) var(--ease-standard)',
      display: 'flex',
      alignItems: 'center'
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      width: 20,
      height: 20,
      borderRadius: '50%',
      background: 'var(--white)',
      boxShadow: 'var(--shadow-xs)',
      transform: checked ? 'translateX(20px)' : 'translateX(0)',
      transition: 'transform var(--dur-base) var(--ease-standard)'
    }
  })), label ? /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: 'var(--font-serif-text)',
      fontSize: 'var(--fs-body)'
    }
  }, label) : null);
}
Object.assign(__ds_scope, { Switch });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/forms/Switch.jsx", error: String((e && e.message) || e) }); }

// components/navigation/Breadcrumb.jsx
try { (() => {
function Breadcrumb({
  items = []
}) {
  return /*#__PURE__*/React.createElement("nav", {
    "aria-label": "Breadcrumb",
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 'var(--space-2)',
      flexWrap: 'wrap',
      fontFamily: 'var(--font-sans)',
      fontSize: 'var(--fs-body-sm)'
    }
  }, items.map((it, i) => {
    const last = i === items.length - 1;
    return /*#__PURE__*/React.createElement(React.Fragment, {
      key: i
    }, last ? /*#__PURE__*/React.createElement("span", {
      style: {
        color: 'var(--text-muted)'
      }
    }, it.label ?? it) : /*#__PURE__*/React.createElement("a", {
      href: it.href || '#',
      style: {
        color: 'var(--link)'
      }
    }, it.label ?? it), last ? null : /*#__PURE__*/React.createElement("span", {
      style: {
        color: 'var(--gray-20)',
        display: 'flex'
      }
    }, /*#__PURE__*/React.createElement(__ds_scope.Icon, {
      name: "chevron-right",
      size: 14
    })));
  }));
}
Object.assign(__ds_scope, { Breadcrumb });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/navigation/Breadcrumb.jsx", error: String((e && e.message) || e) }); }

// components/navigation/Tabs.jsx
try { (() => {
function Tabs({
  items = [],
  value,
  onChange
}) {
  return /*#__PURE__*/React.createElement("div", {
    role: "tablist",
    style: {
      display: 'flex',
      gap: 'var(--space-6)',
      borderBottom: 'var(--border-hairline) solid var(--border-subtle)'
    }
  }, items.map(it => {
    const v = it.value ?? it,
      l = it.label ?? it,
      on = v === value;
    return /*#__PURE__*/React.createElement("button", {
      key: v,
      role: "tab",
      "aria-selected": on,
      onClick: () => onChange && onChange(v),
      style: {
        appearance: 'none',
        background: 'none',
        border: 'none',
        cursor: 'pointer',
        padding: '10px 0',
        fontFamily: 'var(--font-sans)',
        fontSize: 'var(--fs-body)',
        fontWeight: on ? 'var(--fw-semibold)' : 'var(--fw-regular)',
        color: on ? 'var(--text-heading)' : 'var(--text-muted)',
        boxShadow: on ? 'inset 0 -3px 0 0 var(--accent)' : 'none',
        transition: 'var(--transition-interactive)'
      }
    }, l);
  }));
}
Object.assign(__ds_scope, { Tabs });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/navigation/Tabs.jsx", error: String((e && e.message) || e) }); }

__ds_ns.MediaFrame = __ds_scope.MediaFrame;

__ds_ns.PullQuote = __ds_scope.PullQuote;

__ds_ns.ScriptureBlock = __ds_scope.ScriptureBlock;

__ds_ns.Wordmark = __ds_scope.Wordmark;

__ds_ns.Badge = __ds_scope.Badge;

__ds_ns.Button = __ds_scope.Button;

__ds_ns.Card = __ds_scope.Card;

__ds_ns.CardMedia = __ds_scope.CardMedia;

__ds_ns.Divider = __ds_scope.Divider;

__ds_ns.Icon = __ds_scope.Icon;

__ds_ns.IconButton = __ds_scope.IconButton;

__ds_ns.Tag = __ds_scope.Tag;

__ds_ns.Callout = __ds_scope.Callout;

__ds_ns.Dialog = __ds_scope.Dialog;

__ds_ns.Tooltip = __ds_scope.Tooltip;

__ds_ns.Checkbox = __ds_scope.Checkbox;

__ds_ns.Input = __ds_scope.Input;

__ds_ns.Radio = __ds_scope.Radio;

__ds_ns.Select = __ds_scope.Select;

__ds_ns.Switch = __ds_scope.Switch;

__ds_ns.Breadcrumb = __ds_scope.Breadcrumb;

__ds_ns.Tabs = __ds_scope.Tabs;

})();
