/** Shows where a page sits in a deep content hierarchy. */
export interface BreadcrumbProps { items: ({ label: string; href?: string } | string)[] }
export declare function Breadcrumb(props: BreadcrumbProps): JSX.Element;
