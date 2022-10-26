import { memo, useEffect, useMemo, useState } from "react";
import styled from "styled-components";
import type { TableInfo } from "../api";
import DiagramEditor from "./diagram-editor";
import SQLEditor from "./sql-editor";


const Container = styled.div({
    flexGrow: 1,
    display: 'flex',
    flexDirection: 'column',

    '> *[role=tablist]': {
        display: 'flex',
        flexDirection: 'row',

        '> *[role=tab]': {
            border: '1px solid #888',
            borderLeft: 'none',
            userSelect: 'none',

            '&:first-child': {
                borderLeft: '1px solid #888',
            },
            '&[aria-selected=false]': {
                cursor: 'pointer',
            },
            '&[aria-disabled=true]': {
                opacity: 0.6,
            },
            '&[aria-selected=true]': {
                borderBottomColor: 'transparent',
                cursor: 'default',
            },
        },
        '::after': {
            content: '""',
            display: 'block',
            flexGrow: 1,
            flexShrink: 1,
            borderBottom: '1px solid #888',
        },
    },
    '> *[role=tabpanel]': {},
});

export interface QueryEditorProps {
    tables: TableInfo[] | 'input';
    query: string;
    setQuery: (query: string) => void;
    preview: () => void;
}

export type QueryEditorMode = 'diagram' | 'query';

const QueryEditor = memo<QueryEditorProps>(function QueryEditor ({ tables, query, setQuery, preview }) {
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
    }, []);

    useEffect(() => {
        if (tables === 'input' && mode === 'diagram') {
            setMode('query');
        }
    }, [tables]);

    useEffect(() => {
        setQuery('');
    }, [mode, setQuery]);

    return (
        <Container>
            <div role="tablist">
                {modes.map(m => (
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
                    >
                        {m.mode}
                    </div>
                ))}
            </div>
            <div role="tabpanel">
                {mode === 'diagram' ? (
                    <DiagramEditor
                        tables={tables}
                        query={query}
                        setQuery={setQuery}
                        preview={preview}
                    />
                ) : (
                    <SQLEditor
                        tables={tables}
                        query={query}
                        setQuery={setQuery}
                        preview={preview}
                    />
                )}
            </div>
        </Container>
    );
});


export default QueryEditor;
