/** Lucide glyph wrapper; inherits currentColor. Intentional addition — see readme.md. */
export interface IconProps {
  name: string;
  size?: number;
  style?: React.CSSProperties;
}
export declare function Icon(props: IconProps): JSX.Element;
