import type { TableInfo } from "../../pages/dataConnection/database/interfaces";
import { BOX_HEIGHT, BOX_WIDTH, STROKE_RADIUS } from "./config";
import type { IDBEdge, IDBGraph } from "./localTypes";


export const toSQL = (graph: IDBGraph, tables: TableInfo[]): string => {
    if (graph.edges.length === 0) {
        return '';
    }

    let idx = 0;

    try {
        return graph.edges.reduce<string>((sql, link) => {
            const tableFrom = tables[link.from.table];
            const tableTo = tables[link.to.table];
    
            return `${sql} ${link.joinOpt} ${tableTo.name} AS t_${idx++} ON t_${
                idx - 2
            }.${tableFrom.meta[link.from.colIdx].key} = t_${idx - 1}.${tableTo.meta[link.to.colIdx].key}`;
        }, `SELECT * FROM ${tables[graph.edges[0].from.table].name} AS t_${idx++}`);
    } catch (error) {
        console.warn(error);
        return '';
    }

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

export const encodePath = (x1: number, y1: number, x2: number, y2: number, isPreview = false): string => {
    const main = (() => {
        if (Math.abs(x1 - x2) < 1.2 * BOX_WIDTH) {
            const cy = (y1 + y2) / 2;
            const ya = cy - Math.sign(y2 - y1) * STROKE_RADIUS;
            const xb = x1 + Math.sign(x2 - x1) * STROKE_RADIUS;
            const xc = x2 - Math.sign(x2 - x1) * STROKE_RADIUS;
            const yd = cy + Math.sign(y2 - y1) * STROKE_RADIUS;
            if (Math.abs(x1 - x2) < 2 * STROKE_RADIUS) {
                return `M${x1},${y1} V${ya} C${x1},${cy} ${x2},${cy} ${x2},${yd} V${y2}`;
            }
            return `M${x1},${y1} V${ya} Q${x1},${cy} ${xb},${cy} H${xc} Q${x2},${cy} ${x2},${yd} V${y2}`;
        } else {
            const cx = (x1 + x2) / 2;
            const xa = cx - Math.sign(x2 - x1) * STROKE_RADIUS;
            const yb = y1 + Math.sign(y2 - y1) * STROKE_RADIUS;
            const yc = y2 - Math.sign(y2 - y1) * STROKE_RADIUS;
            const xd = cx + Math.sign(x2 - x1) * STROKE_RADIUS;
            if (Math.abs(y1 - y2) < 2 * STROKE_RADIUS) {
                return `M${x1},${y1} H${xa} C${cx},${y1} ${cx},${y2} ${xd},${y2} H${x2}`;
            }
            return `M${x1},${y1} H${xa} Q${cx},${y1} ${cx},${yb} V${yc} Q${cx},${y2} ${xd},${y2} H${x2}`;
        }
    })();

    const arrow = (() => {
        if (isPreview) {
            return '';
        }
        if (Math.abs(x1 - x2) < 1.2 * BOX_WIDTH) {
            const x = x2;
            if (y1 >= y2) {
                const y = y2 + BOX_HEIGHT / 2;
                return `M${x},${y} l-6,6 M${x},${y} l6,6`;
            }
            const y = y2 - BOX_HEIGHT / 2;
            return `M${x},${y} l-6,-6 M${x},${y} l6,-6`;
        } else {
            const y = y2;
            if (x1 >= x2) {
                const x = x2 + BOX_WIDTH / 2;
                return `M${x},${y} l6,-6 M${x},${y} l6,6`;
            }
            const x = x2 - BOX_WIDTH / 2;
            return `M${x},${y} l-6,-6 M${x},${y} l-6,6`;
        }
    })();

    return `${main}${arrow}`;
};