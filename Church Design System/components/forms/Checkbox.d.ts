/** Multi-select control with optional description line. */
export interface CheckboxProps { label: string; description?: string; checked?: boolean; disabled?: boolean; onChange?: (checked: boolean) => void }
export declare function Checkbox(props: CheckboxProps): JSX.Element;
