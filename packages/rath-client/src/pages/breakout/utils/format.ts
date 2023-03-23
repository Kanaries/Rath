import type { IFieldMeta, IFilter } from "@kanaries/loa";

export const coerceNumber = (raw: any, defaultValue = NaN) => {
    if (typeof raw === 'number') {
        return raw;
    } else if (typeof raw === 'string') {
        const numeric = Number(raw);
        if (`${numeric}` === raw) {
            return numeric;
        }
    }
    return defaultValue;
};

export const formatNumber = (num: unknown, fractionDigits = 4): string => {
    const content = coerceNumber(num);
    if (Number.isNaN(content)) {
        return '-';
    }
    return content.toLocaleString(undefined, { maximumFractionDigits: fractionDigits });
};

export const formatRate = (num: unknown, fractionDigits = 4): string => {
    const content = coerceNumber(num);
    if (Number.isNaN(content)) {
        return '-';
    }
    return `${(content * 100).toFixed(fractionDigits).replace(/\.?0+$/, '')}%`;
};

export const formatFilterRule = (rule: IFilter, field: IFieldMeta): string => {
    const fieldName = field.name || field.fid;
    if (rule.type === 'set') {
        return `${fieldName} = ${rule.values.join(',')}`;
    }
    return `${fieldName || field.fid} ∈ ${rule.range.join(',')}]`;
};
