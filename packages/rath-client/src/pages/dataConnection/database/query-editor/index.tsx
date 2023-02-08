import { useEffect, useMemo, useState } from 'react';
import styled from 'styled-components';
import { Pivot, PivotItem } from '@fluentui/react';
import DiagramEditor from './diagram-editor';
import SQLEditor from './sql-editor';
import { QueryEditorProps } from './interfaces';

const Container = styled.div`
    flex-grow: 1;
    flex-shrink: 1;
    overflow: hidden;
    display: flex;
    flex-direction: column;
    > *[role='tabpanel'] {
        flex-grow: 1;
        flex-shrink: 1;
        overflow: hidden;
        width: 100%;
        display: flex;
        flex-direction: column;
    }
`;

export type QueryEditorMode = 'diagram' | 'query';

const QueryEditor = ({ tableEnumerable, tables, query, setQuery, preview }: QueryEditorProps) => {
    const [mode, setMode] = useState<QueryEditorMode>('query');

    const modes = useMemo<
        {
            mode: QueryEditorMode;
            enabled: boolean;
            iconName?: string;
            label: string;
        }[]
    >(() => {
        return [
            {
                mode: 'query',
                enabled: true,
                iconName: 'FileSQL',
                label: 'Query',
            },
            {
                mode: 'diagram',
                enabled: Array.isArray(tables),
                label: 'Diagram',
                iconName: 'VisioDiagram',
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
            <Pivot
                onLinkClick={(item) => {
                    if (item && item.props.itemKey) {
                        setMode(item.props.itemKey as QueryEditorMode);
                    }
                }}
            >
                {modes.map((m, i) => (
                    <PivotItem itemIcon={m.iconName} headerText={m.label} itemKey={m.mode} key={m.mode}></PivotItem>
                ))}
            </Pivot>
            <hr style={{ margin: '1em 0em' }} />
            <div role="tabpanel">
                {mode === 'diagram' ? (
                    <DiagramEditor tableEnumerable={tableEnumerable} tables={tables} query={query} setQuery={setQuery} preview={preview} />
                ) : (
                    <SQLEditor tableEnumerable={tableEnumerable} tables={tables} query={query} setQuery={setQuery} preview={preview} />
                )}
            </div>
        </Container>
    );
};

export default QueryEditor;
