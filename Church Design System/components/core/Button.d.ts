import * as React from 'react';
/**
 * Primary action control. Sans-serif label, 4px radius, never a pill.
 * @startingPoint section="Core" subtitle="Primary, secondary, quiet and invert actions" viewport="700x160"
 */
export interface ButtonProps {
  variant?: 'primary' | 'secondary' | 'quiet' | 'invert';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  fullWidth?: boolean;
  iconBefore?: React.ReactNode;
  iconAfter?: React.ReactNode;
  type?: 'button' | 'submit' | 'reset';
  onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void;
  children?: React.ReactNode;
}
export declare function Button(props: ButtonProps): JSX.Element;
