import type { TableInfo } from "../../pages/dataSource/selection/database/api";
import type { IDBGraph } from "./localTypes";


export const toSQL = (graph: IDBGraph, tables: TableInfo[]): string => {
    if (graph.edges.length === 0) {
        return '';
    }

    return graph.edges.reduce<string>((sql, link) => {
        return `${sql} ${link.type} ${tables[link.to.table].name} ON ${
            tables[link.from.table].name
        }.${link.from.col} = ${tables[link.to.table].name}.${link.to.col}`;
    }, `SELECT * FROM ${tables[graph.edges[0].from.table].name}`);
};
