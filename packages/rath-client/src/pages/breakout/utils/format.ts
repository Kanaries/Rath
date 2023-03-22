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
    return content.toFixed(fractionDigits).replace(/\.?0+$/, '');
};

export const formatRate = (num: unknown, fractionDigits = 4): string => {
    const content = coerceNumber(num);
    if (Number.isNaN(content)) {
        return '-';
    }
    return `${(content * 100).toFixed(fractionDigits).replace(/\.?0+$/, '')}%`;
};
