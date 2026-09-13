import * as React from 'react';
/**
 * Quoted scripture with its reference. Italic serif behind a gold rule.
 * @startingPoint section="Brand" subtitle="Quoted scripture with reference" viewport="700x200"
 */
export interface ScriptureBlockProps { reference?: string; size?: 'sm' | 'md' | 'lg'; tone?: 'ink' | 'invert'; children?: React.ReactNode }
export declare function ScriptureBlock(props: ScriptureBlockProps): JSX.Element;
