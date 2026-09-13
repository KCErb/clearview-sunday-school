/** Immediate on/off setting. Use Checkbox inside forms that are submitted. */
export interface SwitchProps { label?: string; checked?: boolean; disabled?: boolean; onChange?: (checked: boolean) => void }
export declare function Switch(props: SwitchProps): JSX.Element;
