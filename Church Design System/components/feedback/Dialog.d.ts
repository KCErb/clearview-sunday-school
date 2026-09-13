import * as React from 'react';
/** Modal overlay for a focused decision. Scrim is deep blue at 52% with a soft blur. */
export interface DialogProps { open?: boolean; title?: string; width?: number; onClose?: () => void; footer?: React.ReactNode; children?: React.ReactNode }
export declare function Dialog(props: DialogProps): JSX.Element | null;
