import { memo, useEffect, useState } from "react";
import DbGraph from "../../../../../components/dbGraph";
import type { IDBGraph } from "../../../../../components/dbGraph/localTypes";
import { toSQL } from "../../../../../components/dbGraph/utils";
import { QueryEditorProps } from ".";


const DiagramEditor = memo<QueryEditorProps>(function DiagramEditor ({ query, tables, setQuery, preview }) {
    const [graph, setGraph] = useState<IDBGraph>({
        nodes: [],
        edges: [],
    });

    useEffect(() => {
        if (tables !== 'input') {
            const sql = toSQL(graph, tables);
            setQuery(sql);
        }
    }, [graph, setQuery, tables]);

    return tables === 'input' ? null : (
        <DbGraph
            tables={tables}
            graph={graph}
            setGraph={setGraph}
            sql={query}
            preview={preview}
        />
    );
});


export default DiagramEditor;
