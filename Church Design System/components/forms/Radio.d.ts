/** Single choice from a short, visible list. */
export interface RadioProps { name: string; options: ({ value: string; label: string } | string)[]; value?: string; onChange?: (value: string) => void }
export declare function Radio(props: RadioProps): JSX.Element;
