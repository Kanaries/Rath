import type { TableInfo } from "../../type";

export interface QueryEditorProps {
    tableEnumerable: boolean;
    tables: TableInfo[];
    query: string;
    setQuery: (query: string) => void;
    preview: (query?: string) => void;
}
