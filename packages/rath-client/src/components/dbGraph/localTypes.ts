export interface IDBNode {
    source: string;
    x: number;
    y: number;
}

export interface IDBEdge {
    from: number;
    to: number;
    type: 'LEFT JOIN' | 'RIGHT JOIN' | 'INNER JOIN' | 'FULL JOIN';
}

export interface IDBGraph {
    nodes: IDBNode[];
    edges: IDBEdge[];
}