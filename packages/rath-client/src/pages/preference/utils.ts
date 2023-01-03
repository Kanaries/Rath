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
            };
        }
        case 'number': {
            return {
                description: item.description,
                type: 'number',
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
            };
        }
        case 'enum': {
            return {
                description: item.description,
                enum: item.options,
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

export const toJSONValues = (preferences: PreferencesSchema, allowComment = true): string => {
    const data = Object.fromEntries(
        Object.entries(preferences.properties).map(
            ([k, v]) => [k, 'properties' in v ? JSON.parse(toJSONValues(v, false)) : v.value]
        )
    );
    let content = JSON.stringify(data, undefined, 2);
    for (const [k, v] of Object.entries(preferences.properties)) {
        if (v.description && allowComment) {
            content = content.replace(`  "${k}":`, `  // ${v.description}\n  "${k}":`);
        }
    }
    return content;
};
