import * as React from 'react';
/** Native select with brand chrome. */
export interface SelectOption { value: string; label: string }
export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string; hint?: string; options?: (SelectOption | string)[];
}
export declare function Select(props: SelectProps): JSX.Element;
