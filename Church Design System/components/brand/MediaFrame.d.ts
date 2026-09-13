/** Image with optional protection scrim, caption and required artwork credit. */
export interface MediaFrameProps { src?: string; alt?: string; ratio?: string; caption?: string; credit?: string; scrim?: 'bottom' | 'side' }
export declare function MediaFrame(props: MediaFrameProps): JSX.Element;
