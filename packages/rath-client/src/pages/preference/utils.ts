import intl from 'react-intl-universal';
import { ICubeStorageManageMode } from 'visual-insights';
import { COMPUTATION_ENGINE } from '../../constants';
import { IResizeMode, ITaskTestMode } from '../../interfaces';
import { useGlobalStore } from '../../store';
import { EXPLORE_VIEW_ORDER } from '../../store/megaAutomation';
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

export const usePreferencesSchema = (): PreferencesSchema => {
    const {
        commonStore,
        semiAutoStore,
        megaAutoStore,
        ltsPipeLineStore,
    } = useGlobalStore();

    const schema: PreferencesSchema = {
        description: '',
        type: 'object',
        properties: {
            'semiAuto.vizAlgo': {
                title: intl.get('semiAuto.main.vizsys.title'),
                type: 'enum',
                description: intl.get('semiAuto.main.vizsys.title'),
                options: ["lite", "strict"],
                value: semiAutoStore.settings.vizAlgo,
                onChange: value => semiAutoStore.updateSettings('vizAlgo', value),
                required: true,
            },
            'semiAuto.featViews': {
                title: 'features',
                type: 'boolean',
                description: 'Auto Prediction: features',
                value: semiAutoStore.autoAsso.featViews,
                onChange: value => semiAutoStore.updateAutoAssoConfig('featViews', value),
                required: false,
                defaultValue: true,
            },
            'semiAuto.pattViews': {
                title: 'patterns',
                type: 'boolean',
                description: 'Auto Prediction: patterns',
                value: semiAutoStore.autoAsso.pattViews,
                onChange: value => semiAutoStore.updateAutoAssoConfig('pattViews', value),
                required: false,
                defaultValue: true,
            },
            'semiAuto.filterViews': {
                title: 'subsets',
                type: 'boolean',
                description: 'Auto Prediction: subsets',
                value: semiAutoStore.autoAsso.filterViews,
                onChange: value => semiAutoStore.updateAutoAssoConfig('filterViews', value),
                required: false,
                defaultValue: true,
            },
            'semiAuto.neighborViews': {
                title: 'neighbors',
                type: 'boolean',
                description: 'Auto Prediction: neighbors',
                value: semiAutoStore.autoAsso.neighborViews,
                onChange: value => semiAutoStore.updateAutoAssoConfig('neighborViews', value),
                required: false,
                defaultValue: true,
            },
            'megaAuto.cubeStorageManageMode': {
                title: intl.get('config.cubeStorageManageMode.title'),
                type: 'enum',
                description: intl.get('config.cubeStorageManageMode.title'),
                options: [ICubeStorageManageMode.LocalCache, ICubeStorageManageMode.LocalDisk, ICubeStorageManageMode.LocalMix],
                value: ltsPipeLineStore.cubeStorageManageMode,
                onChange: value => ltsPipeLineStore.setCubeStorageManageMode(value as ICubeStorageManageMode),
                required: false,
                defaultValue: ICubeStorageManageMode.LocalMix,
            },
            'megaAuto.engine': {
                title: intl.get('config.computationEngine.title'),
                type: 'enum',
                description: intl.get('config.computationEngine.title'),
                options: [COMPUTATION_ENGINE.webworker, COMPUTATION_ENGINE.clickhouse],
                value: commonStore.computationEngine,
                onChange: value => commonStore.setComputationEngine(value as string),
                required: true,
            },
            'megaAuto.taskMode': {
                title: 'task test mode',
                type: 'enum',
                description: 'task test mode',
                options: [ITaskTestMode.local, ITaskTestMode.server],
                value: commonStore.taskMode,
                onChange: value => commonStore.setTaskTestMode(value as ITaskTestMode),
                required: false,
                defaultValue: ITaskTestMode.local,
            },
            'megaAuto.orderBy': {
                title: intl.get('megaAuto.orderBy.title'),
                type: 'enum',
                description: intl.get('megaAuto.orderBy.title'),
                options: [
                    EXPLORE_VIEW_ORDER.DEFAULT,
                    EXPLORE_VIEW_ORDER.FIELD_NUM,
                    EXPLORE_VIEW_ORDER.CARDINALITY,
                ],
                value: megaAutoStore.orderBy,
                onChange: value => megaAutoStore.setExploreOrder(value as string),
                required: false,
                defaultValue: EXPLORE_VIEW_ORDER.DEFAULT,
            },
            'visualization.excludeScaleZero': {
                title: intl.get('megaAuto.operation.excludeScaleZero'),
                type: 'boolean',
                description: intl.get('megaAuto.operation.excludeScaleZero'),
                value: semiAutoStore.mainVizSetting.excludeScaleZero,
                onChange: value => semiAutoStore.updateMainVizSettings(s => s.excludeScaleZero = value),
                required: false,
                defaultValue: false,
            },
            'visualization.debug': {
                title: intl.get('megaAuto.operation.debug'),
                type: 'boolean',
                description: intl.get('megaAuto.operation.debug'),
                value: semiAutoStore.mainVizSetting.debug,
                onChange: value => semiAutoStore.updateMainVizSettings(s => s.debug = value),
                required: false,
                defaultValue: false,
            },
            'visualization.zoom': {
                title: intl.get('megaAuto.operation.zoom'),
                type: 'boolean',
                description: intl.get('megaAuto.operation.zoom'),
                value: semiAutoStore.mainVizSetting.interactive,
                onChange: value => semiAutoStore.updateMainVizSettings(s => s.interactive = value),
                required: false,
                defaultValue: false,
            },
            'visualization.nlg': {
                title: 'NLG',
                type: 'boolean',
                description: 'NLG (beta)',
                value: semiAutoStore.mainVizSetting.nlg,
                onChange: value => semiAutoStore.updateMainVizSettings(s => s.nlg = value),
                required: false,
                defaultValue: false,
            },
            'visualization.resize': {
                type: 'object',
                description: intl.get('megaAuto.operation.resize'),
                properties: {
                    'visualization.resizeMode': {
                        title: intl.get('megaAuto.operation.resize'),
                        type: 'enum',
                        description: intl.get('megaAuto.operation.resize'),
                        options: [IResizeMode.auto, IResizeMode.control],
                        value: semiAutoStore.mainVizSetting.resize.mode,
                        onChange: value => semiAutoStore.updateMainVizSettings(s => s.resize.mode = value as IResizeMode),
                        required: false,
                        defaultValue: IResizeMode.auto,
                    },
                    'visualization.resize.width': {
                        title: 'width',
                        type: 'number',
                        description: 'width',
                        value: semiAutoStore.mainVizSetting.resize.width,
                        exclusiveMinimum: 0,
                        onChange: (value: number) => semiAutoStore.updateMainVizSettings(s => s.resize.width = value),
                        required: false,
                        defaultValue: 320,
                    },
                    'visualization.resize.height': {
                        title: 'height',
                        type: 'number',
                        description: 'height',
                        value: semiAutoStore.mainVizSetting.resize.height,
                        exclusiveMinimum: 0,
                        onChange: (value: number) => semiAutoStore.updateMainVizSettings(s => s.resize.height = value),
                        required: false,
                        defaultValue: 320,
                    },
                },
                anyOf: [
                    {
                        properties: {
                            'visualization.resizeMode': { 'const': IResizeMode.control },
                        },
                        required: ['visualization.resize.width', 'visualization.resize.height'],
                    },
                    {
                        properties: {
                            'visualization.resizeMode': { 'const': IResizeMode.auto },
                        },
                    },
                ],
            },
        },
    };

    return schema;
};

const STORAGE_KEY = 'rath_app_preferences';

export const savePreferences = (preferences: PreferencesSchema) => {
    const save = toJSONValues(preferences);
    localStorage.setItem(STORAGE_KEY, save);
};

export const loadPreferences = () => {
    return localStorage.getItem(STORAGE_KEY);
};
