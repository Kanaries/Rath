export interface IDBNode {
    source: string;
    x: number;
    y: number;
}

export interface IDBEdge {
    from: {
        table: number;
        colIdx: number;
    };
    to: {
        table: number;
        colIdx: number;
    };
    joinOpt: 'LEFT JOIN' | 'RIGHT JOIN' | 'INNER JOIN' | 'FULL JOIN';
}

export interface IDBGraph {
    nodes: IDBNode[];
    edges: IDBEdge[];
}