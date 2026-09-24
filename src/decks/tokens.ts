// The design system's token sheets, so an in-browser import resolves var(--…) the same way
// scripts/import-deck.mjs does.
import base from '../../Church Design System/tokens/base.css?raw';
import colors from '../../Church Design System/tokens/colors.css?raw';
import fonts from '../../Church Design System/tokens/fonts.css?raw';
import motion from '../../Church Design System/tokens/motion.css?raw';
import semantic from '../../Church Design System/tokens/semantic.css?raw';
import shape from '../../Church Design System/tokens/shape.css?raw';
import spacing from '../../Church Design System/tokens/spacing.css?raw';
import typography from '../../Church Design System/tokens/typography.css?raw';

export const designTokens = [colors, semantic, typography, spacing, shape, fonts, motion, base];
