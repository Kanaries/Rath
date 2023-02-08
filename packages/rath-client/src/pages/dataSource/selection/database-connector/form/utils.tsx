import styled from 'styled-components';
import { Icon, IconButton, Theme } from '@fluentui/react';
import type { DatabaseLevelType } from '../config';
import { INestedListItem } from '../components/nested-list';
import { DatabaseApiOperator, DatabaseRequestPayload, fetchDatabaseList, fetchSchemaList, fetchTableList } from '../api';


export const QueryContainer = styled.div<{ theme: Theme }>`
    flex-grow: 1;
    flex-shrink: 1;
    flex-basis: 0%;
    min-height: 40vh;
    max-height: 40vh;
    overflow: hidden;
    display: grid;
    grid-template-columns: 16em 1fr;
    grid-template-rows: max-content 1fr;
    border: 1px solid ${({ theme }) => theme.palette.neutralLight};
    font-size: 0.8rem;
    > *:nth-child(2n + 1) {
        :not(header) {
            padding-block: 0.6em;
            padding-inline: 0.5em;
        }
        border-right: 1px solid ${({ theme }) => theme.palette.neutralLight};
        > header, > div > div:first-child {
            margin-inline: 1em;
            margin-bottom: 0.2em;
        }
    }
    > *:first-child {
        padding-block: 0.6em;
        padding-inline: 1.2em;
        display: flex;
        align-items: center;
        user-select: none;
        justify-content: space-between;
        > span {
            flex-grow: 1;
            flex-shrink: 1;
            margin-right: 1em;
        }
    }
    > *:last-child {
        display: flex;
        align-items: stretch;
        justify-content: stretch;
        overflow: auto;
    }
`;

export const SyncButton = styled(IconButton)<{ busy: boolean }>`
    width: 24px;
    height: 24px;
    background: none;
    i {
        font-size: 0.7rem;
        animation: rotating 2.4s linear infinite;
        ${({ busy }) => busy ? '' : 'animation: none;'}
    }
    @keyframes rotating {
        from {
            transform: rotate(0);
        }
        to {
            transform: rotate(360deg);
        }
    }
`;

export const PivotList = styled.div`
    display: flex;
    flex-direction: row;
    align-items: stretch;
    overflow: auto hidden;
    background-color: #fcfcfc;
    > * {
        flex-grow: 0;
        flex-shrink: 0;
    }
`;

export const PivotHeader = styled.div<{ primary?: boolean }>`
    display: flex;
    flex-direction: row;
    align-items: center;
    min-width: 6em;
    padding-inline: 1em 0.6em;
    background-color: #f8f8f8;
    font-weight: ${({ primary }) => primary ? 600 : 400};
    cursor: pointer;
    outline: none;
    position: relative;
    :hover:not([aria-disabled="true"]) {
        background-color: #f2f2f2;
        > button {
            opacity: 1;
        }
    }
    &[aria-selected="true"]:not([aria-disabled="true"]) {
        background-image: linear-gradient(to top, currentColor 2px, transparent 2px);
    }
    &[aria-disabled="true"] {
        filter: contrast(0.5) brightness(1.5);
        cursor: default;
    }
    > span {
        flex-grow: 1;
    }
    > button {
        border-radius: 50%;
        font-size: 100%;
        opacity: 0;
        transform: scale(50%);
        margin-left: 0.6em;
    }
`;

export const findNode = (root: INestedListItem[], path: INestedListItem[]): INestedListItem | null => {
    if (path.length === 0) {
        return null;
    }
    const [first] = path;
    for (const item of root) {
        if (item.key === first.key) {
            return path.length === 1 ? item : Array.isArray(item.children) ? findNode(item.children, path.slice(1)) : null;
        }
    }
    return null;
};

export const findNodeByPathId = (root: INestedListItem[], pathId: string): INestedListItem | null => {
    const path = pathId.split('.');
    if (path.length === 0) {
        return null;
    }
    const [first] = path;
    for (const item of root) {
        if (item.key === first) {
            return path.length === 1 ? item : Array.isArray(item.children) ? findNodeByPathId(item.children, path.slice(1).join('.')) : null;
        }
    }
    return null;
};

export const fetchListAsNodes = async (
    levelType: DatabaseLevelType,
    server: string,
    commonParams: Omit<DatabaseRequestPayload<Exclude<DatabaseApiOperator, 'ping'>>, 'func'>,
    hasNextLevelThen: boolean,
): Promise<INestedListItem[] | null> => {
    try {
        switch (levelType) {
            case 'database': {
                const databaseList = await fetchDatabaseList(server, commonParams);
                return databaseList.map<INestedListItem>(database => ({
                    group: 'database',
                    key: database,
                    text: database,
                    children: hasNextLevelThen ? 'lazy' : undefined,
                    icon: <Icon iconName="Database" />,
                }));
            }
            case 'schema': {
                const schemaList = await fetchSchemaList(server, commonParams);
                return schemaList.map<INestedListItem>(schema => ({
                    group: 'schema',
                    key: schema,
                    text: schema,
                    children: hasNextLevelThen ? 'lazy' : undefined,
                    icon: <Icon iconName="TableGroup" />,
                }));
            }
            case 'table': {
                const tableList = await fetchTableList(server, commonParams);
                return tableList.map<INestedListItem>(table => ({
                    group: 'table',
                    key: table.name,
                    text: table.name,
                    icon: <Icon iconName="Table" />,
                    children: table.meta.map(col => ({
                        group: 'column',
                        key: col.key,
                        subtext: col.dataType ?? undefined,
                        text: col.key,
                        icon: (
                            <Icon
                                iconName={
                                    col.dataType?.match(/(Int|Double|Float|Decimal)/) ? 'NumberField'
                                        : col.dataType?.match(/(String|Char|VarChar)/i) ? 'TextField'
                                        : 'FieldEmpty'
                                }
                            />
                        ),
                    })),
                }));
            }
            default: {
                return null;
            }
        }
    } catch {
        return null;
    }
};

export enum EditorKey {
    Monaco = -1,
    Diagram = -2,
}
