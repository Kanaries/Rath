import type { TableInfo } from "../../pages/dataSource/selection/database/api";
import type { IDBEdge, IDBGraph } from "./localTypes";


export const toSQL = (graph: IDBGraph, tables: TableInfo[]): string => {
    if (graph.edges.length === 0) {
        return '';
    }

    return graph.edges.reduce<string>((sql, link) => {
        const tableFrom = tables[link.from.table];
        const tableTo = tables[link.to.table];

        return `${sql} ${link.joinOpt} ${tableTo.name} ON ${
            tableFrom.name
        }.${tableFrom.meta[link.from.colIdx].key} = ${tableTo.name}.${tableTo.meta[link.to.colIdx].key}`;
    }, `SELECT * FROM ${tables[graph.edges[0].from.table].name}`);
};

export const hasCircle = (edges: Readonly<IDBEdge[]>, from: number, to: number): boolean => {
    const checker = new Map<number, 1>();

    checker.set(to, 1);

    const walk = (from: number, except: number | null = null): boolean => {
        checker.set(from, 1);
        let failed = false;

        const neighbors = edges.reduce<number[]>((list, edge) => {
            if (failed) {
                return [];
            }
            if (edge.from.table === from) {
                if (except === edge.to.table) {
                    return list;
                } else if (checker.has(edge.to.table)) {
                    failed = true;
                    return [];
                }
                checker.set(edge.to.table, 1);
                return [...list, edge.to.table];
            } else if (edge.to.table === from) {
                if (except === edge.from.table) {
                    return list;
                } else if (checker.has(edge.from.table)) {
                    failed = true;
                    return [];
                }
                checker.set(edge.from.table, 1);
                return [...list, edge.from.table];
            }
            return list;
        }, []);

        for (const n of neighbors) {
            const res = walk(n, from);
            if (res === true) {
                return true;
            }
        }

        return failed;
    };

    return walk(from);
};
