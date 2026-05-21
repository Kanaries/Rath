import type { IFieldMeta } from "../../interfaces";
import type { IAlgoSchema, IFormItem } from "./config";

const CAT_ENCODE_OPTIONS = [
    { key: 'topk-with-noise', text: 'Top-K With Noise' },
    { key: 'none', text: 'None' },
    { key: 'one-hot', text: 'One-hot Encoding' },
    { key: 'one-hot-with-noise', text: 'One-hot With Noise' },
    { key: 'lex', text: 'Lexicographic Ranking' },
];

const QUANT_ENCODE_OPTIONS = [
    { key: 'bin', text: 'Binning' },
    { key: 'none', text: 'None' },
    { key: 'order', text: 'Ranking' },
];

const BASE_ITEMS: IFormItem[] = [
    {
        key: 'catEncodeType',
        title: 'Categorical Encoding',
        description: 'The encoding to use for categorical variables.',
        dataType: 'string',
        renderType: 'dropdown',
        defaultValue: 'topk-with-noise',
        options: CAT_ENCODE_OPTIONS,
    },
    {
        key: 'quantEncodeType',
        title: 'Quantitative Encoding',
        description: 'The encoding to use for quantitative variables.',
        dataType: 'string',
        renderType: 'dropdown',
        defaultValue: 'bin',
        options: QUANT_ENCODE_OPTIONS,
    },
];

function numericSlider(
    key: string,
    title: string,
    defaultValue: number,
    range: [number, number],
    step: number,
    description: string
): IFormItem {
    return {
        key,
        title,
        description,
        dataType: 'number',
        renderType: 'slider',
        defaultValue,
        range,
        step,
    };
}

function dropdown(
    key: string,
    title: string,
    defaultValue: string | number,
    options: Array<{ key: any; text: string }>,
    description: string
): IFormItem {
    return {
        key,
        title,
        description,
        dataType: typeof defaultValue === 'number' ? 'number' : 'string',
        renderType: 'dropdown',
        defaultValue,
        options,
    };
}

function toggle(key: string, title: string, defaultValue: boolean, description: string): IFormItem {
    return {
        key,
        title,
        description,
        dataType: 'boolean',
        renderType: 'toggle',
        defaultValue,
    };
}

export function getLocalCausalAlgorithmList(fields: readonly IFieldMeta[]): IAlgoSchema {
    const fieldOptions = fields.map((field) => ({
        key: field.fid,
        text: field.name && field.name.length > 0 ? field.name : field.fid,
    }));

    return {
        PC: {
            title: 'PC Algorithm',
            description: 'Portable PC implementation from causal-js. Browser execution is local and does not require Python.',
            items: [
                ...BASE_ITEMS,
                dropdown('indep_test', 'Independence Test', 'chisq', [
                    { key: 'chisq', text: 'Chi-square' },
                    { key: 'fisherz', text: 'Fisher-Z' },
                    { key: 'gsq', text: 'G-square' },
                ], 'The independence test used for causal discovery.'),
                numericSlider('alpha', 'Alpha', 0.05, [0.0001, 1], 0.0001, 'Desired significance level.'),
                toggle('stable', 'Stable', true, 'Whether to use the stable version of PC.'),
                dropdown('uc_rule', 'UC Rule', 0, [
                    { key: 0, text: 'uc_superset' },
                    { key: 1, text: 'maxP' },
                    { key: 2, text: 'definiteMaxP' },
                ], 'The rule to use for unshielded colliders.'),
                dropdown('uc_priority', 'UC Priority', -1, [
                    { key: -1, text: 'default' },
                    { key: 0, text: 'overwrite' },
                    { key: 1, text: 'bi-directed' },
                    { key: 2, text: 'existing' },
                    { key: 3, text: 'stronger' },
                    { key: 4, text: 'stronger_plus' },
                ], 'Priority strategy for collider orientation conflicts.'),
            ],
        },
        FCI: {
            title: 'FCI Algorithm',
            description: 'Portable FCI implementation from causal-js. Browser execution is local and does not require Python.',
            items: [
                ...BASE_ITEMS,
                dropdown('indep_test', 'Independence Test', 'fisherz', [
                    { key: 'chisq', text: 'Chi-square' },
                    { key: 'fisherz', text: 'Fisher-Z' },
                    { key: 'gsq', text: 'G-square' },
                ], 'The independence test used for causal discovery.'),
                numericSlider('alpha', 'Alpha', 0.05, [0.0001, 1], 0.0001, 'Desired significance level.'),
                numericSlider('depth', 'Depth', -1, [-1, 8], 1, 'Search depth for fast adjacency search. -1 means unlimited.'),
                numericSlider('max_path_length', 'Max Path Length', -1, [-1, 16], 1, 'Maximum length of any discriminating path. -1 means unlimited.'),
            ],
        },
        XLearner: {
            title: 'XLearner Algorithm',
            description: 'Frontend XLearner implementation built on top of the local FCI pipeline with functional-dependency-aware skeleton enhancement.',
            items: [
                ...BASE_ITEMS,
                dropdown('indep_test', 'Independence Test', 'gsq', [
                    { key: 'chisq', text: 'Chi-square' },
                    { key: 'fisherz', text: 'Fisher-Z' },
                    { key: 'gsq', text: 'G-square' },
                ], 'The independence test used for causal discovery.'),
                numericSlider('alpha', 'Alpha', 0.05, [0.0001, 1], 0.0001, 'Desired significance level.'),
                numericSlider('depth', 'Depth', -1, [-1, 8], 1, 'Search depth for fast adjacency search. -1 means unlimited.'),
                numericSlider('max_path_length', 'Max Path Length', -1, [-1, 16], 1, 'Maximum length of any discriminating path. -1 means unlimited.'),
            ],
        },
        CD_NOD: {
            title: 'CD-NOD Algorithm',
            description: 'Portable CD-NOD implementation from causal-js. The context index is handled entirely in the browser.',
            items: [
                ...BASE_ITEMS,
                dropdown('c_indx', 'Condition Index', '$id', [
                    { key: '$id', text: 'Row Index' },
                    ...fieldOptions,
                ], 'Time or domain index that captures changing factors.'),
                numericSlider('alpha', 'Alpha', 0.05, [0.0001, 1], 0.0001, 'Desired significance level.'),
                dropdown('indep_test', 'Independence Test', 'fisherz', [
                    { key: 'fisherz', text: 'Fisher-Z' },
                ], 'The independence test used for causal discovery.'),
                toggle('stable', 'Stable', true, 'Whether to use the stable version of CD-NOD.'),
                dropdown('uc_rule', 'UC Rule', 0, [
                    { key: 0, text: 'uc_superset' },
                    { key: 1, text: 'maxP' },
                    { key: 2, text: 'definiteMaxP' },
                ], 'The rule to use for unshielded colliders.'),
                dropdown('uc_priority', 'UC Priority', -1, [
                    { key: -1, text: 'default' },
                    { key: 0, text: 'overwrite' },
                    { key: 1, text: 'bi-directed' },
                    { key: 2, text: 'existing' },
                    { key: 3, text: 'stronger' },
                    { key: 4, text: 'stronger_plus' },
                ], 'Priority strategy for collider orientation conflicts.'),
            ],
        },
        GES: {
            title: 'GES Algorithm',
            description: 'Portable GES implementation from causal-js.',
            items: [
                ...BASE_ITEMS,
                dropdown('score_func', 'Score Function', 'local_score_BIC', [
                    { key: 'local_score_BIC', text: 'BIC score' },
                    { key: 'local_score_BDeu', text: 'BDeu score' },
                ], 'Scoring function used during search.'),
                numericSlider('maxP', 'Max Number of Parents', 0, [0, 32], 1, 'Allowed maximum number of parents. 0 means unrestricted.'),
            ],
        },
        ExactSearch: {
            title: 'Exact Search Algorithm',
            description: 'Portable exact DAG search from causal-js for small graphs.',
            items: [
                ...BASE_ITEMS,
                dropdown('search_method', 'Search Method', 'astar', [
                    { key: 'astar', text: 'A* search' },
                    { key: 'dp', text: 'Dynamic Programming' },
                ], 'Method of exact search.'),
                toggle('use_path_extension', 'Use Path Extension', true, 'Whether to use optimal path extension.'),
                toggle('use_k_cycle_heuristic', 'Use K-cycle Heuristic', false, 'Whether to use k-cycle conflict heuristic for A*.'),
                numericSlider('maxP', 'Max Number of Parents', 0, [0, 8], 1, 'Maximum number of parents. 0 means unrestricted.'),
            ],
        },
        GIN: {
            title: 'GIN Algorithm',
            description: 'Portable hidden-causal cluster discovery from causal-js.',
            items: [
                ...BASE_ITEMS,
                dropdown('indep_test_method', 'Independence Test', 'kci', [
                    { key: 'kci', text: 'KCI' },
                    { key: 'hsic', text: 'HSIC' },
                ], 'Independence test backend used by GIN.'),
                numericSlider('alpha', 'Alpha', 0.05, [0.0001, 1], 0.0001, 'Desired significance level.'),
            ],
        },
        GRaSP: {
            title: 'GRaSP Algorithm',
            description: 'Portable GRaSP implementation from causal-js.',
            items: [
                ...BASE_ITEMS,
                dropdown('score_func', 'Score Function', 'local_score_BIC', [
                    { key: 'local_score_BIC', text: 'BIC score' },
                ], 'Scoring function used during search.'),
                numericSlider('depth', 'Depth', -1, [-1, 8], 1, 'Search depth for fast adjacency search. -1 means unlimited.'),
            ],
        },
        CAM_UV: {
            title: 'CAM-UV Algorithm',
            description: 'Portable CAM-UV implementation from causal-js.',
            items: [
                ...BASE_ITEMS,
                numericSlider('alpha', 'Alpha', 0.05, [0.0001, 1], 0.0001, 'Desired significance level.'),
                numericSlider('num_explanatory_vals', 'Max Explanatory Variables', 0, [0, 16], 1, 'Maximum number of variables used to infer causality. 0 means all variables.'),
            ],
        },
        RCD: {
            title: 'RCD Algorithm',
            description: 'Portable RCD implementation from causal-js.',
            items: [
                ...BASE_ITEMS,
                numericSlider('max_explanatory_num', 'Max Explanatory Variables', 2, [1, 5], 1, 'Maximum number of explanatory variables.'),
                numericSlider('cor_alpha', 'Correlation Alpha', 0.01, [0, 1], 0.002, 'Pearson correlation threshold.'),
                numericSlider('ind_alpha', 'HSIC Alpha', 0.01, [0, 1], 0.002, 'HSIC significance threshold.'),
                numericSlider('shapiro_alpha', 'Shapiro Alpha', 0.01, [0, 1], 0.002, 'Shapiro-Wilk significance threshold.'),
                toggle('MLHSICR', 'Use MLHSICR', false, 'Whether to use MLHSICR for multiple regression.'),
                dropdown('bw_method', 'Bandwidth Method', 'mdbs', [
                    { key: 'mdbs', text: 'Median distance between samples' },
                    { key: 'scott', text: 'Scott rule' },
                    { key: 'silverman', text: 'Silverman rule' },
                ], 'Bandwidth method for HSIC.'),
            ],
        },
    };
}
