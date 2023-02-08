import { memo, useEffect, useState } from "react";
import styled from "styled-components";
import type { TableData, TableLabels } from "../..";
import Diagram from "../../components/diagram";
import type { IDBGraph } from "../../components/diagram/localTypes";
import { toSQL } from "../../../../../../components/dbGraph/utils";
import TablePreview from "../table-preview";
import type { TableInfo } from "../../type";


const Container = styled.div`
    width: 100%;
    height: 100%;
    display: flex;
    flex-direction: column;
    overflow: hidden;
    > * {
        flex-grow: 1;
        flex-shrink: 1;
        flex-basis: 0%;
        overflow: hidden;
        margin: 0;
        padding: 0;
        :first-child {
            border-bottom: 1px solid #eee;
            overflow: auto;
        }
        :last-child {
            display: flex;
            flex-direction: column;
            overflow: hidden;
        }
    }
`;

interface DiagramEditorProps {
    disabled: boolean;
    busy: boolean;
    tables: TableInfo[];
    query: string;
    setQuery: (q: string) => void;
    preview: TableData<TableLabels> | null;
    doPreview: () => void;
}

const DiagramEditor = memo<DiagramEditorProps>(function DiagramEditor ({ disabled, query, busy, tables, setQuery, preview, doPreview }) {
    const [graph, setGraph] = useState<IDBGraph>({
        nodes: [],
        edges: [],
    });

    useEffect(() => {
        if (!disabled) {
            const sql = toSQL(graph, tables);
            setQuery(sql);
        }
    }, [graph, setQuery, tables, disabled]);

    return (
        <Container>
            <div>
                <TablePreview data={preview ?? { columns: [], rows: [] }} />
            </div>
            <div>
                {disabled || (
                    <Diagram
                        busy={busy}
                        disabled={disabled}
                        tables={tables}
                        graph={graph}
                        setGraph={setGraph}
                        sql={query}
                        preview={doPreview}
                    />
                )}
            </div>
        </Container>
    );
});


export default DiagramEditor;
