import { registerIcons } from '@fluentui/react';
import datasetOptions from './config';

export const StackTokens = {
    childrenGap: 20,
};

const iconPathPrefix = '/assets/icons/';

registerIcons({
    icons: Object.fromEntries(
        datasetOptions.map<[string, JSX.Element]>((opt) => [
            opt.key,
            opt.icon ? (
                <img
                    role="presentation"
                    aria-hidden
                    src={`${iconPathPrefix}${opt.icon}`}
                    alt={opt.text}
                    style={{
                        width: '100%',
                        height: '100%',
                    }}
                />
            ) : (
                <></>
            ),
        ])
    ),
});

export type TableLabels = {
    key: string;
    colIndex: number;
    dataType: string | null;
}[];

type TableRowItem<TL extends TableLabels> = {
    [key in keyof TL]: any;
};

export interface TableData<TL extends TableLabels = TableLabels> {
    columns: TL;
    rows: TableRowItem<TL>[];
}

export const inputWidth = '180px';
