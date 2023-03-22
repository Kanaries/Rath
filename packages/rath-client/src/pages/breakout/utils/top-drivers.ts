import type { IFieldMeta, IFilter, IRow } from "@kanaries/loa";
import type { BreakoutMainField } from "../store";
import { applyDividers, impactSubgroupComparison, impactSubgroupGeneral, statSubgroup } from "./stats";

export interface ISubgroupResult {
    path?: string[];
    field: IFieldMeta;
    filter: IFilter;
    id: string;
    rate: number;
    rateBefore?: number;
    value: number;
    diff: number;
    impact: number;
}

const MAX_SUBGROUPS = 5;
const MAX_DEPTH = 3;

export const analyzeContributions = (
    population: readonly IRow[],
    fields: readonly IFieldMeta[],
    target: BreakoutMainField,
    compareBase: number,
    path: string[] = [],
): ISubgroupResult[] => {
    const subgroups: { field: IFieldMeta; filter: IFilter & { type: 'set' }; value: unknown; records: readonly IRow[]; others: readonly IRow[] }[] = [];
    for (const field of fields) {
        if (field.fid === target.fid) {
            continue;
        }
        if (field.analyticType === 'measure' || field.semanticType === 'quantitative' || field.semanticType === 'temporal' || field.distribution.length <= 1) {
            continue;
        }
        for (const subgroup of field.distribution) {
            const filter = {
                type: 'set' as const,
                fid: field.fid,
                values: [subgroup.memberName],
            };
            const [records, others] = applyDividers(population, [filter]);
            subgroups.push({
                field,
                value: subgroup.memberName,
                filter,
                records,
                others,
            });
        }
    }
    const nextFields = subgroups.reduce<IFieldMeta[]>((list, subgroup) => {
        if (!list.some(f => f.fid === subgroup.field.fid)) {
            list.push(subgroup.field);
        }
        return list;
    }, []);
    const headers: { subgroup: typeof subgroups[number]; value: ISubgroupResult }[] = [];
    for (const subgroup of subgroups) {
        const id = `${subgroup.field.name || subgroup.field.fid} = ${subgroup.filter.values[0]}`;
        const value = statSubgroup(subgroup.records, target.fid, target.aggregator);
        const impact = impactSubgroupGeneral(
            population,
            subgroup.records,
            subgroup.others,
            target.fid,
            target.aggregator,
        );
        if (!Number.isFinite(impact) || impact === 0) {
            continue;
        }
        headers.push({
            subgroup,
            value: {
                path,
                field: subgroup.field,
                filter: subgroup.filter,
                id,
                rate: subgroup.records.length / population.length,
                value,
                diff: (value - compareBase) / compareBase,
                impact,
            },
        });
    }
    headers.sort((a, b) => Math.abs(b.value.impact) - Math.abs(a.value.impact));
    const result: ISubgroupResult[] = [];
    for (const header of headers.slice(0, MAX_SUBGROUPS)) {
        result.push(header.value);
        if (nextFields.length > 1 && path.length < MAX_DEPTH) {
            const nextResult = analyzeContributions(header.subgroup.records, nextFields.filter(f => f.fid !== header.subgroup.field.fid), target, compareBase, [...path, header.value.id]);
            result.push(...nextResult);
        }
    }
    return result;
};

export const analyzeComparisons = (
    targetGroup: readonly IRow[],
    compareGroup: readonly IRow[], 
    fields: readonly IFieldMeta[],
    target: BreakoutMainField,
    path: string[] = [],
): ISubgroupResult[] => {
    const subgroups: { field: IFieldMeta; filter: IFilter & { type: 'set' }; value: unknown; T1: readonly IRow[]; T2: readonly IRow[] }[] = [];
    for (const field of fields) {
        if (field.fid === target.fid) {
            continue;
        }
        if (field.analyticType === 'measure' || field.semanticType === 'quantitative' || field.semanticType === 'temporal' || field.distribution.length <= 1) {
            continue;
        }
        for (const subgroup of field.distribution) {
            const filter = {
                type: 'set' as const,
                fid: field.fid,
                values: [subgroup.memberName],
            };
            const [T2] = applyDividers(targetGroup as IRow[], [filter]);
            const [T1] = applyDividers(compareGroup as IRow[], [filter]);
            subgroups.push({
                field,
                value: subgroup.memberName,
                filter,
                T1,
                T2,
            });
        }
    }
    const nextFields = subgroups.reduce<IFieldMeta[]>((list, subgroup) => {
        if (!list.some(f => f.fid === subgroup.field.fid)) {
            list.push(subgroup.field);
        }
        return list;
    }, []);
    const headers: { subgroup: typeof subgroups[number]; value: ISubgroupResult }[] = [];
    for (const subgroup of subgroups) {
        const id = `${subgroup.field.name || subgroup.field.fid} = ${subgroup.filter.values[0]}`;
        const value = statSubgroup(subgroup.T2, target.fid, target.aggregator);
        const compareBase = statSubgroup(subgroup.T1, target.fid, target.aggregator);
        const impact = impactSubgroupComparison(
            subgroup.T2,
            subgroup.T1,
            targetGroup,
            compareGroup,
            target.fid,
            target.aggregator,
        );
        if (!Number.isFinite(impact) || impact === 0) {
            continue;
        }
        headers.push({
            subgroup,
            value: {
                path,
                field: subgroup.field,
                filter: subgroup.filter,
                id,
                rate: subgroup.T2.length / targetGroup.length,
                rateBefore: subgroup.T1.length / compareGroup.length,
                value,
                diff: (value - compareBase) / compareBase,
                impact,
            },
        });
    }
    headers.sort((a, b) => Math.abs(b.value.impact) - Math.abs(a.value.impact));
    const result: ISubgroupResult[] = [];
    for (const header of headers.slice(0, MAX_SUBGROUPS)) {
        result.push(header.value);
        if (nextFields.length > 1 && path.length < MAX_DEPTH) {
            const nextResult = analyzeComparisons(header.subgroup.T2, header.subgroup.T1, nextFields.filter(f => f.fid !== header.subgroup.field.fid), target, [...path, header.value.id]);
            result.push(...nextResult);
        }
    }
    return result;
};
