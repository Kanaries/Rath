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
    const data = Object.fromEntries(
        Object.entries(preferences.properties).map(
            ([k, v]) => [k, 'properties' in v ? JSON.parse(toJSONValues(v)) : v.value]
        )
    );
    return JSON.stringify(data, undefined, 2);
};

export const diffJSON = (obj1: any, obj2: any): { [key: string]: any } => {
    const diff: { [key: string]: any } = {};

    for (const [key, next] of Object.entries(obj2)) {
        const prev = obj1[key];
        if (key in obj1 && prev !== next && typeof prev !== 'object' && typeof next !== 'object') {
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
    // TODO: go deeper
    return null;
};
