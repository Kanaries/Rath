import { IForm } from '../causal/config';
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

export const toForm = (title: string, preferences: PreferencesSchema): [IForm, { [key: string]: any }] => {
    const form: IForm = {
        title,
        description: preferences.description,
        items: [],
    };
    const values: { [key: string]: any } = {};

    for (const [k, v] of Object.entries(preferences.properties)) {
        if (v.type === 'object') {
            continue;
        }
        values[k] = v.value;
        switch (v.type) {
            case 'boolean': {
                form.items.push({
                    key: k,
                    title: v.title,
                    description: v.description,
                    dataType: 'boolean',
                    renderType: 'toggle',
                });
                break;
            }
            case 'enum': {
                form.items.push({
                    key: k,
                    title: v.title,
                    description: v.description,
                    dataType: 'string',
                    renderType: 'dropdown',
                    options: v.options.map(d => ({
                        key: d,
                        text: `${d}`,
                    })),
                });
                break;
            }
            case 'number': {
                form.items.push({
                    key: k,
                    title: v.title,
                    description: v.description,
                    dataType: 'number',
                    renderType: 'slider',
                    range: [v.minimum ?? Infinity, v.maximum ?? Infinity],
                });
                break;
            }
            default: {
                break;
            }
        }
    }

    return [form, values];
};
