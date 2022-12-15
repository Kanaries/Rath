import intl from 'react-intl-universal';
import type { I18nSetupFunction } from "../../../store/langStore";
import zhCN from './zh-CN';


export const LocaleKeys = {
    title: 'Causal Analysis',
    no_connection: {
        before: 'The server is not responding. Some features of the causal module will be inaccessible now. This module is currently under experiment. If you need support, please click ',
        text: 'here',
        after: ' to email us.',
        subject: '[Causal] Consult for Support of Experimental Causal Module',
    },
    step: {
        dataset_config: {
            title: 'Data Configuration',
            description: 'Select proper subset from data source, and choose the variables you want to focus.',
        },
        fd_config: {
            title: 'Functional Dependencies (optional)',
            description: 'Define functional dependencies - based on background knowledge or common sense - before running the discovering. It will assist algorithm to make better decisions.',
        },
        causal_model: {
            title: 'Causal Model',
            description: 'Execute algorithm to discover causality, edit on graph, and use the result to bring into a new process of analysis.',
        },
    },
    step_control: {
        prev: 'Back',
        next: 'Continue',
        bypass: 'Bypass',
    },
    dataset_config: {
        calc: 'Computation',
        filter: 'Filters',
        filter_output: 'Origin size: {origin} rows, size after filtering: {filtered} rows',
        filter_disabled_output: 'Origin size: {origin} rows (no filters applied)',
        sample: 'Sampling',
        sample_output: 'Size after sampling: {size} rows',
        fields: 'Fields to Analyze',
        field_info: {
            field: 'Field ({selected} / {total})',
            extInfo: 'Extended',
            unique: 'Unique Values',
            sType: 'Type',
            mean: 'Mean',
            std: 'Standard Deviation',
            median: 'Median',
        },
    },
} as const;

export type LocaleData<T> = {
    [key in keyof T]: T[key] extends string ? string : LocaleData<T[key]>;
};
type MergedString<A, B> = A extends string ? B extends string ? `${A}.${B}` : 0 : 0;
// prevent infinite loop
type KeyPath<T> = Exclude<{
    [key_1 in keyof T]: key_1 extends string ? T[key_1] extends string ? key_1
        : MergedString<key_1, {
            [key_2 in keyof T[key_1]]: T[key_1][key_2] extends string ? key_2
                : MergedString<key_2, {
                    [key_3 in keyof T[key_1][key_2]]: T[key_1][key_2][key_3] extends string ? key_3
                        : MergedString<key_3, {
                            [key_4 in keyof T[key_1][key_2][key_3]]: T[key_1][key_2][key_3][key_4] extends string ? key_4 : string
                        }[keyof T[key_1][key_2][key_3]]>
                }[keyof T[key_1][key_2]]>
        }[keyof T[key_1]]> : 0;
}[keyof T], 0>;

export type Locales = LocaleData<typeof LocaleKeys>;
export type LocaleKey = KeyPath<typeof LocaleKeys>;

const data: { [lang: string]: Locales } = {
    'en-US': LocaleKeys,
    'zh-CN': zhCN,
};

let i18nPrefix = 'causal';

export const getI18n = (key: LocaleKey, variables?: { [prop: string]: string | number }): string => {
    return intl.get(`${i18nPrefix}.${key}`, variables);
};

export const setup: I18nSetupFunction = (lang: string, id: string) => {
    i18nPrefix = id;
    return data[lang] ?? LocaleKeys;
};
