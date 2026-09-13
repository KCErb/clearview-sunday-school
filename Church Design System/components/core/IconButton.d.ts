import * as React from 'react';
/** Square, label-less action. Always pass an accessible label. */
export interface IconButtonProps {
  name: string;
  label: string;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'quiet' | 'filled';
  disabled?: boolean;
  onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void;
}
export declare function IconButton(props: IconButtonProps): JSX.Element;
