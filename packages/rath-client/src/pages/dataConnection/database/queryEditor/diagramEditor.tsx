import { memo, useEffect, useState } from "react";
import styled from "styled-components";
import Diagram from "../../../../components/dbGraph";
import type { IDBGraph } from "../../../../components/dbGraph/localTypes";
import TablePreview from "../tablePreview";
import { toSQL } from "../../../../components/dbGraph/utils";
import type { TableInfo } from "../interfaces";
import type { TableData, TableLabels } from "../main";


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
    children?: any;
}

const emptyPreview = { meta: [], columns: [], rows: [] };

const DiagramEditor = memo<DiagramEditorProps>(function DiagramEditor ({ disabled, busy, tables, setQuery, preview, doPreview, children }) {
    const [tempQuery, setTempQuery] = useState('');

    const [graph, setGraph] = useState<IDBGraph>({
        nodes: [],
        edges: [],
    });

    useEffect(() => {
        setGraph({
            nodes: [],
            edges: [],
        });
    }, [tables]);

    useEffect(() => {
        setTempQuery('');
        if (!disabled) {
            const sql = toSQL(graph, tables);
            setTempQuery(sql);
            if (sql) {
                setQuery(sql);
            }
        }
    }, [graph, setQuery, tables, disabled]);

    return (
        <Container>
            <div>
                <TablePreview name="preview" data={preview ?? emptyPreview} />
            </div>
            <div>
                <div>
                    {children}
                </div>
                {disabled || (
                    <Diagram
                        busy={busy}
                        disabled={disabled}
                        tables={tables}
                        graph={graph}
                        setQuery={setTempQuery}
                        setGraph={setGraph}
                        sql={tempQuery}
                        preview={() => doPreview()}
                    />
                )}
            </div>
        </Container>
    );
});


export default DiagramEditor;
