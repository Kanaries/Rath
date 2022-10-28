import { useEffect, useMemo, useState } from "react";
import styled from "styled-components";
import type { TableInfo } from "../api";
import DiagramEditor from "./diagram-editor";
import SQLEditor from "./sql-editor";


const Container = styled.div`
    flex-grow: 1;
    flex-shrink: 1;
    overflow: hidden;
    display: flex;
    flex-direction: column;

    > *[role=tablist] {
        display: flex;
        flex-direction: row;
        --corner-radius: 0.5em;
        --border-color: #444;
        --bgColor: #fff;

        > *[role=tab] {
            border: 1px solid var(--border-color);
            border-left: none;
            user-select: none;
            line-height: 1.2em;
            padding: 0.2em calc(1.25em + var(--corner-radius)) 0.4em 0.6em;
            border-radius: var(--corner-radius) var(--corner-radius) 0 0;
            position: relative;
            background-color: var(--bgColor);

            &:first-child, &[aria-selected=true] {
                border-left: 1px solid var(--border-color);
            }
            &:not(:first-child) {
                margin-left: calc(-2 * var(--corner-radius));
                padding: 0.2em calc(1.25em + var(--corner-radius)) 0.4em calc(0.6em + var(--corner-radius));
            }
            &[aria-selected=false] {
                cursor: pointer;
            }
            &[aria-disabled=true] {
                opacity: 0.6;
            }
            &[aria-selected=true] {
                border-bottom-color: var(--bgColor);
                cursor: default;
            }
        }
        ::after {
            content: "";
            display: block;
            flex-grow: 1;
            flex-shrink: 1;
            border-bottom: 1px solid var(--border-color);
        }
    }
    > *[role=tabpanel] {
        flex-grow: 1;
        flex-shrink: 1;
        overflow: hidden;
        width: 100%;
        display: flex;
        flex-direction: column;
    }
`;

export interface QueryEditorProps {
    tableEnumerable: boolean;
    tables: TableInfo[];
    query: string;
    setQuery: (query: string) => void;
    preview: () => void;
}

export type QueryEditorMode = 'diagram' | 'query';

const QueryEditor = ({ tableEnumerable, tables, query, setQuery, preview }: QueryEditorProps) => {
    const [mode, setMode] = useState<QueryEditorMode>('query');

    const modes = useMemo<{
        mode: QueryEditorMode;
        enabled: boolean;
    }[]>(() => {
        return [
            {
                mode: 'query',
                enabled: true,
            },
            {
                mode: 'diagram',
                enabled: Array.isArray(tables),
            },
        ];
    }, [tables]);

    useEffect(() => {
        if (!tableEnumerable && mode === 'diagram') {
            setMode('query');
        }
    }, [tableEnumerable, mode]);

    useEffect(() => {
        setQuery('');
    }, [mode, setQuery]);

    return (
        <Container>
            <div role="tablist">
                {modes.map((m, i) => (
                    <div
                        role="tab"
                        aria-selected={m.mode === mode}
                        aria-disabled={!m.enabled}
                        key={m.mode}
                        onClick={() => {
                            if (m.mode !== mode && m.enabled) {
                                setMode(m.mode);
                            }
                        }}
                        style={{ zIndex: m.mode === mode ? modes.length + 1 : modes.length - i }}
                    >
                        {m.mode}
                    </div>
                ))}
            </div>
            <div role="tabpanel">
                {mode === 'diagram' ? (
                    <DiagramEditor
                        tableEnumerable={tableEnumerable}
                        tables={tables}
                        query={query}
                        setQuery={setQuery}
                        preview={preview}
                    />
                ) : (
                    <SQLEditor
                        tableEnumerable={tableEnumerable}
                        tables={tables}
                        query={query}
                        setQuery={setQuery}
                        preview={preview}
                    />
                )}
            </div>
        </Container>
    );
};


export default QueryEditor;
