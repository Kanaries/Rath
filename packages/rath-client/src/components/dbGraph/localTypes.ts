export interface IDBNode {
    id: string;
    label: string;
    x: number;
    y: number;
}

export interface IDBEdge {
    from: string;
    to: string;
    label: string;
}

export interface IDBGraph {
    nodes: IDBNode[];
    edges: IDBEdge[];
}