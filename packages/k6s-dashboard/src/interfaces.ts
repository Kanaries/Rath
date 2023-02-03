import type { FC } from "react";
import type { VisualizationSpec } from 'vega-embed';
import type { Config as VegaLiteConfig } from 'vega-lite';
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

export type DashboardBlockConfig = {
    /** @default 1 */
    grow?: number;
    themeId: number;
    transparent?: boolean;
};

// eslint-disable-next-line @typescript-eslint/ban-types
export type IDashboardBlock<Name extends string, Data extends Record<string, unknown> = {}> = {
    id: string;
    type: Name;
    config?: Partial<DashboardBlockConfig>;
} & Data;

export type DashboardLayoutBlock = IDashboardBlock<'layout', {
    direction: 'horizontal' | 'vertical';
    children: DashboardBlock[];
}>;

export type IDashboardResultData = {
    title: string;
    description?: string;
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
    specification: Omit<VisualizationSpec, 'data'>;
    config?: VegaLiteConfig;
};

export type DashboardDataBlock = IDashboardBlock<'data', (
    | ({ mode: 'result' } & IDashboardResultData)
    | ({ mode: 'table' } & IDashboardTableData)
    | ({ mode: 'vega' } & IDashboardVegaData)
)>;

export type DashboardTextBlock = IDashboardBlock<'text', {
    content: string;
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

export type DashboardBlocks = {
    layout: DashboardLayoutBlock,
    data: DashboardDataBlock,
    text: DashboardTextBlock,
    image: DashboardImageBlock,
    web_content: DashboardWebContentBlock,
    blank: DashboardBlankBlock,
    exporter: DashboardExportBlock,
    enquete: DashboardEnqueteBlock,
    extension: DashboardExtensionBlock,
};

export type DashboardBlockType = keyof DashboardBlocks;

export type DashboardBlockMap = {
    [key in keyof DashboardBlocks]: DashboardBlocks[key] & {
        type: key;
    };
};

export type DashboardBlock = DashboardBlockMap[keyof DashboardBlockMap];

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

export type WorkspaceBlockConfig<Type extends DashboardBlockType, T extends DashboardBlock = DashboardBlockMap[Type]> = {
    type: Type;
    name: string;
    getIcon?: (data: T) => JSX.Element;
    getTileDisplayName?: (data: T) => JSX.Element;
    onRender: FC<{ data: T }>;
    onInspect: FC<{ data: T; onChange: (next: T) => void }>;
};
