import type { TableInfo } from "../../pages/dataSource/selection/database/api";
import type { IDBGraph } from "./localTypes";


export const toSQL = (graph: IDBGraph, tables: TableInfo[]): string => {
    const nodes = ((): number[] => {
        const start = graph.nodes.findIndex(node => {
            return graph.edges.find(
                e => tables[e.from.table].name === node.source
            ) && !graph.edges.find(
                e => tables[e.to.table].name === node.source
            );
        });

        if (start === -1) {
            return [];
        }

        const nodes: number[] = [start];

        const walk = (from: number) => {
            const neighbors = graph.edges.reduce<typeof nodes>((list, edge, i) => {
                if (edge.from.table === from) {
                    if (nodes.find(n => n === edge.to.table)) {
                        return list;
                    }
                    return [...list, i];
                }
                return list;
            }, []);

            nodes.push(...neighbors);

            for (const n of neighbors) {
                walk(n);
            }
        };

        if (graph.edges.length < 1) {
            return [];
        }

        walk(nodes[0]);

        return nodes;
    })().reduce<{ from: number; to: number }[]>((list, node, idx, arr) => {
        if (idx === 0) {
            return [];
        } else if (idx === 1) {
            return [{
                from: arr[0],
                to: node,
            }];
        }

        return list;
    }, []);

    if (nodes.length <= 1) {
        return '';
    }

    console.log(nodes);

    // return nodes.slice(1).reduce<{ sql: string; from: string; rel: string; fromCol: string }>(({ sql, from, rel, fromCol }, node) => {
    //     const to = tables[node.table];
    //     const cur = `${to.name}.${node.col}`;

    //     return {
    //         sql: `${sql} ${rel} ${to.name} ON ${from}.${fromCol} = ${cur}`,
    //         from: to.name,
    //         rel: node.rel,
    //         fromCol: node.fromCol,
    //     };
    // }, {
    //     sql: `SELECT * FROM ${tables[nodes[0].table].name}`,
    //     rel: nodes[0].rel,
    //     from: `${tables[nodes[0].table].name}.${nodes[0].col}`,
    //     fromCol: '',
    // }).sql;
    return '';
};
