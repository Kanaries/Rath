import intl from 'react-intl-universal';
import { EdgeAssert, NodeAssert } from '../../../store/causalStore/modelStore';
import { ExplorationKey, LayoutMethod } from '../../../store/causalStore/viewStore';
import type { I18nSetupFunction } from "../../../store/langStore";
import { CausalLinkDirection } from '../../../utils/resolve-causal';
import { MATRIX_MARK_TYPE } from '../matrixPanel';
import { VIEW_TYPE, MATRIX_TYPE } from '../step/causalModal';
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
            unique: 'Unique Values',
            sType: 'Type',
            mean: 'Mean',
            std: 'Standard Deviation',
            median: 'Median',
        },
    },
    fd_config: {
        batch: {
            title: 'One Click Setup',
            delete_all: 'Delete All',
            from_ext: 'Use Derivations',
            from_detection: 'Detect',
            preview: 'Preview',
            cancel: 'Cancel',
        },
        batch_mode: {
            overwrite_only: 'Update and Replace',
            fill_only: 'Update Undeclared',
            fully_replace: 'Clear and Replace All',
        },
        edit: 'Edit Mode',
    },
    computing: 'computing',
    chart: {
        re_layout: 'Refresh Layout',
        layout: {
            [LayoutMethod.FORCE]: 'Force',
            [LayoutMethod.CIRCULAR]: 'Circular',
            [LayoutMethod.RADIAL]: 'Radial',
            [LayoutMethod.GRID]: 'Grid',
        },
        assertion: {
            edge: 'Link Two Nodes',
            node: 'Double Click on A Node',
            [EdgeAssert.TO_EFFECT]: 'To Effect',
            [EdgeAssert.TO_NOT_EFFECT]: 'To Not Effect',
            [EdgeAssert.TO_BE_RELEVANT]: 'To Be Relevant',
            [EdgeAssert.TO_BE_NOT_RELEVANT]: 'To Be Not Relevant',
            [NodeAssert.FORBID_AS_CAUSE]: 'Forbid As Cause',
            [NodeAssert.FORBID_AS_EFFECT]: 'Forbid As Effect',
            click_edge: 'Click on An Edge',
            forbid: 'Revert',
            delete: 'Remove',
        },
        tools: {
            edit: {
                settings: 'Behavior Settings',
                clear: 'Delete All',
            },
            resize: 'Enable Zoom',
            write: 'Modify Constraints',
            filter_by_confidence: 'Filter by Confidence',
            filter_by_weight: 'Filter by Contribution',
        },
    },
    viewType: {
        label: 'View Mode',
        [VIEW_TYPE.matrix]: 'Matrix',
        [VIEW_TYPE.diagram]: 'Diagram',
    },
    matrix: {
        [MATRIX_TYPE.mutualInfo]: {
            name: 'Mutual Information',
            action: 'Compute',
        },
        [MATRIX_TYPE.conditionalMutualInfo]: {
            name: 'Conditional Mutual Information',
            action: 'Compute',
        },
        [MATRIX_TYPE.causal]: {
            name: 'Causal Model',
            action: 'Causal Discovery',
        },
        markType: {
            label: 'Mark',
            [MATRIX_MARK_TYPE.circle]: 'Circle',
            [MATRIX_MARK_TYPE.square]: 'Square',
        },
        causal_direction: {
            label: 'Link Type',
            [CausalLinkDirection.none]: 'Not relevant',
            [CausalLinkDirection.directed]: 'Effect',
            [CausalLinkDirection.reversed]: 'Effected by',
            [CausalLinkDirection.weakDirected]: 'Effect (weak)',
            [CausalLinkDirection.weakReversed]: 'Effected by (weak)',
            [CausalLinkDirection.undirected]: 'Relevant',
            [CausalLinkDirection.weakUndirected]: 'Relevant (weak)',
            [CausalLinkDirection.bidirected]: 'Effect each other',
        },
        causal_direction_desc: {
            [CausalLinkDirection.none]: 'A is irrelevant to B.',
            [CausalLinkDirection.directed]: 'A influences B.',
            [CausalLinkDirection.reversed]: 'A is influenced by B.',
            [CausalLinkDirection.weakDirected]: 'In some cases, A influences B.',
            [CausalLinkDirection.weakReversed]: 'In some cases, A is influenced by B.',
            [CausalLinkDirection.undirected]: 'A is relevant to B, but the direction is not decided.',
            [CausalLinkDirection.weakUndirected]: 'In different cases, A or B is relevant to the other one.',
            [CausalLinkDirection.bidirected]: 'Both A and B influences each other.',
        },
    },
    storage: {
        save: 'Save Model',
        load: 'Load Model',
        title: 'Saved Models',
        list: 'Model List',
        apply: 'Load',
    },
    form: {
        trigger: 'Params',
        title: 'Settings',
        first_level: 'Algorithm',
        first_level_desc: 'The algorithm to use.',
        run: 'Run',
    },
    task: {
        reload: 'Reload',
    },
    extra: {
        clear_focused: 'Reset Selection',
    },
    submodule: {
        [ExplorationKey.AUTO_VIS]: {
            title: 'Auto Vis',
            chart: 'Visualization',
            meta_info: 'Meta Info',
            meta: {
                dist: 'Distribution',
                unique: 'Unique Values',
                mean: 'Mean',
                min: 'Min',
                qt_25: '1st Quartile',
                qt_50: 'Median',
                qt_75: '3rd Quartile',
                max: 'Max',
                stdev: 'Standard Derivation',
            },
            relation: 'Relations',
            rel: {
                cause: 'Cause',
                value: 'Correlation',
                effect: 'Effect',
            },
        },
        [ExplorationKey.WHAT_IF]: {
            title: 'What If',
            algorithm: 'Algorithm',
        },
        [ExplorationKey.HYPOTHESIS_TEST]: {
            title: 'Hypothesis Examination',
            population: 'Population',
            outcome: 'Outcome',
            confounders: 'Confounders',
            delete: 'Remove',
            add: 'Add',
            effect_modifiers: 'Effect Modifiers',
            predicates: 'Predicates',
            history: {
                title: 'History',
                clear: 'Clear History',
                hypothesis: 'Hypothesis',
                score: 'Score',
                params: 'Parameters',
                full_set: 'full set',
                template: 'If ({Pdc}) causes the change of {O} in {Pop}.',
            },
        },
        [ExplorationKey.CROSS_FILTER]: {
            title: 'Mutual Inspection',
        },
        [ExplorationKey.CAUSAL_INSIGHT]: {
            title: 'Field Insight',
            header: 'Main Field',
            engine: 'Service',
            diff_mode: 'Diff Mode',
            diff: {
                other: 'Other',
                full: 'Full',
                'two-group': 'Two Groups',
            },
            index_key: 'Index Key',
            empty: 'Null',
            aggregate: 'Aggregation Type',
            aggregate_op: {
                false: 'Null (Detail)',
                sum: 'Sum',
                mean: 'Mean',
                count: 'Count',
            },
            two_group: {
                text: 'Pick {key}',
                foreground: 'Foreground Group',
                background: 'Background Group',
            },
            run: 'Insight',
            why_query: 'Why Query',
            normalize: 'Normalize Stack',
            distribution: 'Distribution',
            comparison: 'Comparison',
            insight: {
                explanation: {
                    unvisualizedDimension: {
                        label: 'Unvisualized Dimension',
                        description: 'Unvisualized dimension field({ dimension }) is distributed differently from the background group, that may influence the distribution of field.noEvents({ mainField }) in the same population. Score: score({ responsibility }).',
                    },
                },
                no_more: 'Can not find more clues.',
            },
        },
        [ExplorationKey.GRAPHIC_WALKER]: {
            title: 'Manual Exploration',
        },
        [ExplorationKey.PREDICT]: {
            title: 'Prediction',
            mission: {
                classification: 'Classification',
                regression: 'Regression',
            },
            config: 'Configuration',
            result: 'Result',
            select_model: 'Select Model',
            scope: 'Scope',
            feature: 'Feature',
            target: 'Target',
            field: 'Field',
            comparison: 'Comparison',
            index: 'Task ID',
            algo: 'Algorithm',
            accuracy: 'Accuracy',
            clear: 'Clear Record',
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
