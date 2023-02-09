import type { IECStatus } from './interfaces';

export const RATH_INDEX_COLUMN_KEY = '__rath_index_col_key__';

export const PIVOT_KEYS = {
    dataSource: 'dataSource',
    connection: 'connection',
    editor: 'editor',
    support: 'support',
    megaAuto: 'megaAuto',
    semiAuto: 'semiAuto',
    dashBoardDesigner: 'dashBoardDesigner',
    painter: 'painter',
    collection: 'collection',
    dashboard: 'dashboard',
    causal: 'causal',
} as const;

export const COMPUTATION_ENGINE = {
    clickhouse: 'clickhouse',
    webworker: 'webworker',
};

export const EXPLORE_MODE = {
    first: 'first',
    familiar: 'familiar',
    comprehensive: 'comprehensive',
    manual: 'manual',
};

export const DEMO_DATA_REQUEST_TIMEOUT = 1000 * 10;

export const ENGINE_CONNECTION_STAGES: Array<{ stage: number; name: IECStatus; description?: string }> = [
    { stage: 0, name: 'client', description: 'client module imported.' },
    { stage: 1, name: 'proxy', description: 'database proxy connector launched.' },
    { stage: 2, name: 'engine', description: 'clickhouse connected.' },
];

export const RESULT_STORAGE_SPLITOR = '\n===RATH_STORAGE_SPLITOR===\n';

export const STORAGE_FILE_SUFFIX = 'krs';

// /** @deprecated */
// export const EDITOR_URL = 'https://kanaries.cn/vega-editor/';

export const STORAGE_INSTANCE = 'rath_storage_instance'

export const STORAGES = {
    DATASOURCE: 'datasource',
    WORKSPACE: 'workspace',
    META: 'meta',
    CAUSAL_MODEL: 'causal',
    STATE: 'state',
    ITERATOR: 'iterator',
    CONFIG: 'config',
    ITERATOR_META: 'iterator_meta',
}

export enum RATH_ENV {
    DEV = 'development environment',
    TEST = 'test environment',
    LPE = 'local preview environment',
    IPE = 'integrative preview environment',
    ONLINE = 'online production environment',
}

// This file is included in Worker so never forget to check if `window` is undefined!!!!!
export const RathEnv: RATH_ENV = (
    process.env.NODE_ENV === 'development' ? RATH_ENV.DEV
        : process.env.NODE_ENV === 'test' ? RATH_ENV.TEST
        : globalThis.window === undefined || globalThis.window?.location.host.match(/^(.*\.)?kanaries\.(net|cn)$/) ? RATH_ENV.ONLINE
        : globalThis.window?.location.host.match(/^.*kanaries\.vercel\.app$/) ? RATH_ENV.IPE : RATH_ENV.LPE
);

export const KanariesDatasetFilenameCloud = 'data.kanaries-data';
export const KanariesDatasetPackCloudExtension = 'kanaries-pack';
