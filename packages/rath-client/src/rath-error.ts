import intl from 'react-intl-universal';
import type { IErrorInfo } from './components/error/store';

type ErrorMessageLocales = {
    raw: string;
    locales: {
        [lang: string]: string | undefined;
    };
};

export type RathErrorType = {
    errId: `E${string}`;    // unique; "E" + module_flag(1,2) + id(2)
    displayName: string;    // unique, primary key
    message: ErrorMessageLocales;
};

export type RathErrorOption = {
    errId: `E${string}`;    // unique; "E" + module_flag(1,2) + id(2)
    displayName: string;    // unique, primary key
    message: string;
};

enum ERR_NAMESPACES {
    DATA_SOURCE = 10,
}

const RATH_ERROR = {
    ConnectorError: {
        errId: `E${ERR_NAMESPACES.DATA_SOURCE}00`,
        displayName: 'ConnectorError',
        message: {
            raw: 'Connector did not respond to the ping.\nPlease make sure the server of the connector is started.',
            locales: {
                'zh-CN': 'Connector 没有响应 ping 请求。\n请检查 connector 服务是否已开启。',
            },
        },
    } as RathErrorType,
    SourceIdError: {
        errId: `E${ERR_NAMESPACES.DATA_SOURCE}01`,
        displayName: 'SourceIdError',
        message: {
            raw: 'Failed to get source id.',
            locales: {
                'zh-CN': '获取 source id 失败。',
            },
        },
    } as RathErrorType,
    FetchDatabaseListFailed: {
        errId: `E${ERR_NAMESPACES.DATA_SOURCE}02`,
        displayName: 'FetchDatabaseListFailed',
        message: {
            raw: 'Failed to get database list.',
            locales: {
                'zh-CN': '获取 database 列表失败。',
            },
        },
    } as RathErrorType,
    FetchSchemaListFailed: {
        errId: `E${ERR_NAMESPACES.DATA_SOURCE}03`,
        displayName: 'FetchSchemaListFailed',
        message: {
            raw: 'Failed to get schema list.',
            locales: {
                'zh-CN': '获取 schema 列表失败。',
            },
        },
    } as RathErrorType,
    FetchTableListFailed: {
        errId: `E${ERR_NAMESPACES.DATA_SOURCE}04`,
        displayName: 'FetchTableListFailed',
        message: {
            raw: 'Failed to get table list.',
            locales: {
                'zh-CN': '获取 table 列表失败。',
            },
        },
    } as RathErrorType,
    FetchTablePreviewFailed: {
        errId: `E${ERR_NAMESPACES.DATA_SOURCE}05`,
        displayName: 'FetchTablePreviewFailed',
        message: {
            raw: 'Failed to get table preview.',
            locales: {
                'zh-CN': '获取 table 预览失败。',
            },
        },
    } as RathErrorType,
    QueryExecutionError: {
        errId: `E${ERR_NAMESPACES.DATA_SOURCE}06`,
        displayName: 'QueryExecutionError',
        message: {
            raw: 'Failed to execute SQL query `{sql}`.',
            locales: {
                'zh-CN': '执行查询 `{sql}` 时出现错误。',
            },
        },
    } as RathErrorType,
};

export const getRathError = (name: keyof typeof RATH_ERROR, detail?: any, data?: { [key: string]: string }): IErrorInfo => {
    const err = RATH_ERROR[name];

    return {
        title: `[${err.errId}] ${err.displayName}`,
        type: 'error',
        content: `${intl.get(`error.${err.displayName}`, data)}${detail && detail instanceof Error && (detail as Error).message ? `\n\n${detail}` : ''}`,
    };
};

export const loadRathErrorLocales = (lang: string): { [displayName: string]: string } => {
    const res: { [displayName: string]: string } = {};

    for (const name in RATH_ERROR) {
        if (Object.prototype.hasOwnProperty.call(RATH_ERROR, name)) {
            const re = (RATH_ERROR as unknown as { [n: typeof name]: RathErrorType })[name];
            res[name] = re.message.locales[lang] ?? re.message.raw;
        }
    }

    return res;
};

export default RATH_ERROR;
