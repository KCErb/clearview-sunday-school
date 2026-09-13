import * as React from 'react';
/** Selectable or removable keyword. The only pill-shaped element in the system. */
export interface TagProps { selected?: boolean; onClick?: () => void; onRemove?: () => void; children?: React.ReactNode }
export declare function Tag(props: TagProps): JSX.Element;
