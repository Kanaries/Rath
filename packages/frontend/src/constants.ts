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
    lts: 'lts'
  } as const;

export const COMPUTATION_ENGINE = {
  clickhouse: 'clickhouse',
  webworker: 'webworker'
}

export const DEMO_DATA_REQUEST_TIMEOUT = 1000 * 10;