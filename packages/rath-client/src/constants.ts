import { IECStatus } from "./interfaces";

export const RATH_INDEX_COLUMN_KEY = '__rath_index_col_key__';

export const INIT_TOP_K_DIM_GROUP_NUM = 50;

export const PIVOT_KEYS = {
    dataSource: 'dataSource',
    noteBook: 'noteBook',
    gallery: 'explore',
    dashBoard: 'dashBoard',
    explainer: 'explainer',
    editor: 'editor',
    support: 'support',
    lts: 'lts',
    pattern: 'pattern',
    progressiveDashBoard: 'progressiveDashBoard',
    painter: 'painter',
    collection: 'collection'
  } as const;

export const COMPUTATION_ENGINE = {
  clickhouse: 'clickhouse',
  webworker: 'webworker'
}

export const EXPLORE_MODE = {
  first: 'first',
  familiar: 'familiar',
  comprehensive: 'comprehensive',
  manual: 'manual'
}

export const DEMO_DATA_REQUEST_TIMEOUT = 1000 * 10;

export const ENGINE_CONNECTION_STAGES: Array<{ stage: number; name: IECStatus; description?: string }> = [
  { stage: 0, name: 'client', description: 'client module importetd.' },
  { stage: 1, name: 'proxy', description: 'database proxy connector lanuched.' },
  { stage: 2, name: 'engine', description: 'clickhouse connected.' }
];

export const RESULT_STORAGE_SPLITOR = '\n===RATH_STORAGE_SPLITOR===\n'

export const STORAGE_FILE_SUFFIX = 'krs'

export const EDITOR_URL = 'https://kanaries.cn/vega-editor/'