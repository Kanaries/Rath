import type { IFieldMeta, IRow } from "../../interfaces";
import type { PagLink } from "./config";

export type CausalDiscoveryAlgorithm =
    | 'PC'
    | 'FCI'
    | 'XLearner'
    | 'CD_NOD'
    | 'GES'
    | 'ExactSearch'
    | 'GIN'
    | 'GRaSP'
    | 'CAM_UV'
    | 'RCD';

export interface CausalDiscoveryField {
    fid: IFieldMeta['fid'];
    name?: IFieldMeta['name'];
    semanticType: IFieldMeta['semanticType'];
}

export interface CausalDiscoveryFuncDepParam {
    fid: string;
    type?: string;
}

export interface CausalDiscoveryFuncDep {
    fid: string;
    params: CausalDiscoveryFuncDepParam[];
    func?: string;
}

export interface CausalDiscoveryRequest {
    algorithm: CausalDiscoveryAlgorithm;
    dataSource: readonly IRow[];
    fields: readonly CausalDiscoveryField[];
    focusedFields: readonly string[];
    bgKnowledgesPag: readonly PagLink[];
    funcDeps: readonly CausalDiscoveryFuncDep[];
    params: Record<string, any>;
}

export interface CausalDiscoveryResult {
    matrix: number[][];
    fields: CausalDiscoveryField[];
    origMatrix?: number[][];
    extra?: Record<string, unknown>;
}
