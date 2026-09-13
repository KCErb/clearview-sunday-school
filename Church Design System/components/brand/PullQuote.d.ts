import * as React from 'react';
/** Quotation from a living voice — a prophet, a leader, a class member. */
export interface PullQuoteProps { attribution?: string; role?: string; tone?: 'ink' | 'invert'; children?: React.ReactNode }
export declare function PullQuote(props: PullQuoteProps): JSX.Element;
