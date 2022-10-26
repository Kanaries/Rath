export interface IDBNode {
    source: string;
    x: number;
    y: number;
}

export interface IDBEdge {
    from: {
        table: number;
        col: string;
    };
    to: {
        table: number;
        col: string;
    };
    type: 'LEFT JOIN' | 'RIGHT JOIN' | 'INNER JOIN' | 'FULL JOIN';
}

export interface IDBGraph {
    nodes: IDBNode[];
    edges: IDBEdge[];
}