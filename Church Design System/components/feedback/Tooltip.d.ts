import * as React from 'react';
/** Short clarifying label on hover or focus. Never holds essential information. */
export interface TooltipProps { label: string; placement?: 'top' | 'bottom'; children?: React.ReactNode }
export declare function Tooltip(props: TooltipProps): JSX.Element;
