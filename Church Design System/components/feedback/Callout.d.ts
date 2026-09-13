import * as React from 'react';
/** Inline aside that sets a passage apart from body copy without shouting. */
export interface CalloutProps { tone?: 'note' | 'scripture' | 'caution' | 'critical'; title?: string; icon?: string; children?: React.ReactNode }
export declare function Callout(props: CalloutProps): JSX.Element;
