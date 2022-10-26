import { memo, useState } from "react";
import { QueryEditorProps } from ".";
import DbGraph from "../../../../../components/dbGraph";
import { IDBGraph } from "../../../../../components/dbGraph/localTypes";


const DiagramEditor = memo<QueryEditorProps>(function DiagramEditor ({ tables, setQuery }) {
    const [graph, setGraph] = useState<IDBGraph>({
        nodes: [],
        edges: [],
    });

    return tables === 'input' ? null : (
        <DbGraph
            tables={tables}
            graph={graph}
            setGraph={setGraph}
        />
    );
});


export default DiagramEditor;
