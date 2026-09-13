import * as React from 'react';
/** Horizontal separation. `rule` is the short gold accent used under slide and section titles. */
export interface DividerProps { variant?: 'hairline' | 'rule' | 'ornament'; align?: 'left' | 'center'; style?: React.CSSProperties }
export declare function Divider(props: DividerProps): JSX.Element;
