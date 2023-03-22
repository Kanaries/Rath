export const coerceNumber = (raw: any, defaultValue = NaN) => {
    return typeof raw === 'number' ? raw : defaultValue;
};

export const formatNumber = (num: unknown, fractionDigits = 4): string => {
    const content = coerceNumber(num);
    if (Number.isNaN(content)) {
        return '-';
    }
    return content.toFixed(fractionDigits).replace(/\.?0+$/, '');
};

export const formatRate = (num: unknown, fractionDigits = 4): string => {
    const content = coerceNumber(num);
    if (Number.isNaN(content)) {
        return '-';
    }
    return `${(content * 100).toFixed(fractionDigits).replace(/\.?0+$/, '')}%`;
};
