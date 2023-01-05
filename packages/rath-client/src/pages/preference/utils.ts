import type { AnyDescriptor, PreferencesSchema } from './types';


const toJSONSchemaProp = (item: AnyDescriptor | PreferencesSchema): undefined | object => {
    switch (item.type) {
        case 'object': {
            return {
                description: item.description,
                type: 'object',
                properties: Object.fromEntries(
                    Object.entries(item.properties).map(
                        ([k, v]) => [k, toJSONSchemaProp(v)]
                    ).filter(([_, v]) => Boolean(v))
                ),
                required: Object.entries(item.properties).filter(([_, v]) => 'required' in v && v.required).map(([k]) => k),
                allOf: item.allOf,
                anyOf: item.anyOf,
            };
        }
        case 'number': {
            return {
                description: item.description,
                type: 'number',
                default: 'defaultValue' in item ? item.defaultValue : undefined,
                minimum: item.minimum,
                exclusiveMinimum: item.exclusiveMinimum,
                maximum: item.maximum,
                exclusiveMaximum: item.exclusiveMaximum,
            };
        }
        case 'boolean': {
            return {
                description: item.description,
                type: 'boolean',
                default: 'defaultValue' in item ? item.defaultValue : undefined,
            };
        }
        case 'enum': {
            return {
                description: item.description,
                enum: item.options,
                type: item.options.every(opt => typeof opt === 'string') ? 'string'
                    : item.options.every(opt => typeof opt === 'number') ? 'number'
                    : undefined,
                default: 'defaultValue' in item ? item.defaultValue : undefined,
            };
        }
        default: {
            return undefined;
        }
    }
};

export const toJSONSchema = (title: string, preferences: PreferencesSchema) => {
    return {
        '$schema': 'http://json-schema.org/schema',
        title,
        description: preferences.description,
        type: 'object',
        properties: Object.fromEntries(
            Object.entries(preferences.properties).map(
                ([k, v]) => [k, toJSONSchemaProp(v)]
            ).filter(([_, v]) => Boolean(v))
        ),
        required: Object.entries(preferences.properties).filter(([_, v]) => 'required' in v && v.required).map(([k]) => k),
    };
};

export const toJSONValues = (preferences: PreferencesSchema): string => {
    const items = Object.entries(preferences.properties).map(
        ([k, v]) => [k, 'properties' in v ? JSON.parse(toJSONValues(v)) : v.value]
    );

    const conditions: { [key: string]: boolean } = {};

    for (const condition of preferences.anyOf ?? []) {
        let matched = false;
        if ('properties' in condition) {
            let ok = true;
            for (const [key, decl] of Object.entries(condition.properties)) {
                const item = items.find(which => which[0] === key);
                if (ok && decl['const'] !== item?.[1]) {
                    ok = false;
                }
            }
            matched = ok;
        }
        if ('required' in condition) {
            for (const key of condition.required!) {
                if (!(key in conditions)) {
                    conditions[key] = false;
                }
                if (conditions[key] === false) {
                    conditions[key] = matched;
                }
            }
        }
    }

    const entries = items.filter(item => {
        return conditions[item[0]] !== false;
    });

    return JSON.stringify(Object.fromEntries(entries), undefined, 2);
};

export const diffJSON = (obj1: any, obj2: any): { [key: string]: any } => {
    const diff: { [key: string]: any } = {};

    for (const [key, next] of Object.entries(obj2)) {
        const prev = obj1[key];
        if (typeof next === 'object') {
            for (const [k, v] of Object.entries(diffJSON(prev, next))) {
                diff[k] = v;
            }
            continue;
        }
        if (prev !== next && (prev === undefined || typeof prev !== 'object') && typeof next !== 'object') {
            diff[key] = next;
        }
    }

    return diff;
};

export const getItem = (preferences: PreferencesSchema, key: string): AnyDescriptor | null => {
    const which = preferences.properties[key];
    if (which) {
        if (which.type === 'object') {
            return null;
        }
        return which;
    }
    for (const subSchema of Object.values(preferences.properties).filter(p => p.type === 'object') as PreferencesSchema[]) {
        const match = getItem(subSchema, key);
        if (match) {
            return match;
        }
    }
    return null;
};
