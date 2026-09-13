import * as React from 'react';
/** Single- or multi-line text entry with label, hint and error. */
export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string; hint?: string; error?: string; multiline?: boolean; rows?: number;
}
export declare function Input(props: InputProps): JSX.Element;
