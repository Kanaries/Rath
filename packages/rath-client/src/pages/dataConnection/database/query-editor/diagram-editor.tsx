import { memo, useEffect, useState } from 'react';
import DbGraph from '../../../../components/dbGraph';
import type { IDBGraph } from '../../../../components/dbGraph/localTypes';
import { toSQL } from '../../../../components/dbGraph/utils';
import { QueryEditorProps } from './interfaces';

const DiagramEditor = memo<QueryEditorProps>(function DiagramEditor({ tableEnumerable, query, tables, setQuery, preview }) {
    const [graph, setGraph] = useState<IDBGraph>({
        nodes: [],
        edges: [],
    });

    useEffect(() => {
        if (tableEnumerable) {
            const sql = toSQL(graph, tables);
            setQuery(sql);
        }
    }, [graph, setQuery, tables, tableEnumerable]);

    return !tableEnumerable ? null : <DbGraph tables={tables} graph={graph} setGraph={setGraph} sql={query} preview={preview} />;
});

export default DiagramEditor;
