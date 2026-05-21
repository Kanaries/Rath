import { workerService } from '../../services';
import type { CausalDiscoveryRequest, CausalDiscoveryResult } from './discoveryTypes';
/* eslint import/no-webpack-loader-syntax:0 */
// @ts-ignore
// eslint-disable-next-line
import CausalDiscoveryWorker from './discovery.worker.ts?worker';

function normalizeCellValue(value: unknown): unknown {
    if (
        value === null ||
        value === undefined ||
        typeof value === 'string' ||
        typeof value === 'number' ||
        typeof value === 'boolean'
    ) {
        return value;
    }
    if (typeof value === 'bigint') {
        return value.toString();
    }
    if (value instanceof Date) {
        return value.toISOString();
    }
    if (Array.isArray(value)) {
        return value.map(normalizeCellValue);
    }
    if (typeof value === 'object') {
        return JSON.stringify(value);
    }
    return String(value);
}

function createSerializableRequest(props: CausalDiscoveryRequest): CausalDiscoveryRequest {
    return {
        algorithm: props.algorithm,
        dataSource: props.dataSource.map((row) => {
            const plainRow: Record<string, unknown> = {};
            Object.entries(row).forEach(([key, value]) => {
                plainRow[key] = normalizeCellValue(value);
            });
            return plainRow;
        }),
        fields: props.fields.map((field) => ({
            fid: field.fid,
            name: field.name,
            semanticType: field.semanticType,
        })),
        focusedFields: [...props.focusedFields],
        bgKnowledgesPag: props.bgKnowledgesPag.map((link) => ({
            src: link.src,
            tar: link.tar,
            src_type: link.src_type,
            tar_type: link.tar_type,
        })),
        funcDeps: props.funcDeps.map((funcDep) => ({
            fid: funcDep.fid,
            params: funcDep.params.map((param) => ({
                fid: param.fid,
                type: param.type,
            })),
            func: funcDep.func,
        })),
        params: Object.fromEntries(Object.entries(props.params ?? {}).map(([key, value]) => [key, normalizeCellValue(value)])),
    };
}

export async function causalDiscoveryService(props: CausalDiscoveryRequest): Promise<CausalDiscoveryResult> {
    const worker = new CausalDiscoveryWorker();
    try {
        const payload = createSerializableRequest(props);
        const result = await workerService<CausalDiscoveryResult, CausalDiscoveryRequest>(worker, payload);
        if (result.success) {
            return result.data;
        }
        throw new Error(result.message);
    } finally {
        worker.terminate();
    }
}
