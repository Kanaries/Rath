import type { CSSProperties } from "react";
import type { IDashboardTheme } from "./theme";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type Static<T> = T extends Record<keyof any, any> ? {
    readonly [key in keyof T]: Static<T[key]>;
} : Readonly<T>;

export interface IRow {
    [key: string]: string | number | unknown;
}

export type DashboardEvent<NE extends Event = Event> = {
    nativeEvent: NE;
};

export type DashboardEventHandler = (ev: DashboardEvent) => void;

export type DashboardTextPart = {
    text: string;
    style?: CSSProperties;
    link?: string;
} | string;

export type DashboardTextNode = {
    /** @default "none" */
    role?: "header" | "explanation" | "none";
    value: DashboardTextPart[];
};

export type DashboardBlockConfig = {
    /** @default 1 */
    grow?: number;
    themeId: number;
    transparent?: boolean;
};

// eslint-disable-next-line @typescript-eslint/ban-types
export type IDashboardBlock<Name extends string, Data extends Record<string, unknown> = {}> = {
    type: Name;
    config?: Partial<DashboardBlockConfig>;
} & Data;

export type DashboardLayoutBlock = IDashboardBlock<'layout', {
    direction: 'horizontal' | 'vertical';
    children: DashboardBlock[];
}>;

export type IDashboardResultData = {
    title: DashboardTextPart;
    description?: DashboardTextPart;
    /** a function to get the result */
    target: string;
};

export type IDashboardTableData = {
    fields: {
        name: string;
        target: string;
    }[];
    /** a function to build the table */
    transform?: string;
};

export type IDashboardVegaData = {
    /** vega-lite schema */
    specification: Record<string, unknown>;
};

export type DashboardDataBlock = IDashboardBlock<'data', (
    | ({ mode: 'result' } & IDashboardResultData)
    | ({ mode: 'table' } & IDashboardTableData)
    | ({ mode: 'vega' } & IDashboardVegaData)
)>;

export type DashboardTextBlock = IDashboardBlock<'text', {
    contents: DashboardTextNode[];
}>;

export type DashboardImageBlock = IDashboardBlock<'image', {
    /** URL */
    target: string;
    altText?: string;
    link?: string;
}>;

export type DashboardWebContentBlock = IDashboardBlock<'web_content', {
    /** URL */
    target: string;
    /** @default false */
    interactive?: boolean;
}>;

export type DashboardBlankBlock = IDashboardBlock<'blank'>;

export type DashboardExportBlock = IDashboardBlock<'export'>;

export type DashboardEnqueteBlock = IDashboardBlock<'enquete', {
    href: string;
    /** JSON schema */
    form: Record<string, unknown>;
}>;

export type DashboardExtensionBlock = IDashboardBlock<'extension', {
    extensionId: string;
    options?: Record<string, unknown>;
}>;

export type DashboardBlock = (
    | DashboardLayoutBlock
    | DashboardDataBlock
    | DashboardTextBlock
    | DashboardImageBlock
    | DashboardWebContentBlock
    | DashboardBlankBlock
    | DashboardExportBlock
    | DashboardEnqueteBlock
    | DashboardExtensionBlock
);

export type DashboardBlockType = DashboardBlock['type'];

export type DashboardSpecification = {
    version: number;
    title: string;
    size: {
        width: number;
        height: number;
        padding: number;
        spacing: number;
    };
    config: {
        themes: Partial<IDashboardTheme>[];
    };
    items: DashboardLayoutBlock;
};

export type DashboardInfo = {
    title: string;
};
