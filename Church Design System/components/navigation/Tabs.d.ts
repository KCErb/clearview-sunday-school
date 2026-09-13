/**
 * Switches between sibling views. Underline indicator in cerulean; never a filled pill.
 * @startingPoint section="Navigation" subtitle="Underlined tab bar" viewport="700x140"
 */
export interface TabsProps { items: ({ value: string; label: string } | string)[]; value?: string; onChange?: (value: string) => void }
export declare function Tabs(props: TabsProps): JSX.Element;
