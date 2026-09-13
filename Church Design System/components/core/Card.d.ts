import * as React from 'react';
/**
 * Content container. Hairline border, 6px radius, shadow only when it floats above the page.
 * @startingPoint section="Core" subtitle="Flat, raised and accented content cards" viewport="700x220"
 */
export interface CardProps {
  elevation?: 'flat' | 'raised' | 'floating';
  accent?: boolean;
  padding?: string;
  children?: React.ReactNode;
  style?: React.CSSProperties;
}
export declare function Card(props: CardProps): JSX.Element;
export interface CardMediaProps { src?: string; alt?: string; ratio?: string }
export declare function CardMedia(props: CardMediaProps): JSX.Element;
