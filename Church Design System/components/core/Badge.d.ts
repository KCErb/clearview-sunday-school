import * as React from 'react';
/** Small uppercase status or category marker. */
export interface BadgeProps { tone?: 'neutral' | 'accent' | 'growth' | 'warm' | 'solid'; children?: React.ReactNode }
export declare function Badge(props: BadgeProps): JSX.Element;
