import intl from 'react-intl-universal';
import { notify } from '../components/error';
import type { IRow, IResponse } from '../interfaces';

export function errorCodeHandler (res: Response) {
    if (res.status === 200) return;
    if (res.status === 500) return;
    if (res.status === 404) {
        throw new Error('Fail to connect the server, check your network.')
    }
    throw new Error(res.statusText)
}
async function getRequest<T extends IRow = IRow, R = void>(path: string, payload?: T): Promise<R> {
    const url = new URL(path);
    if (payload) {
        Object.keys(payload).forEach((k) => {
            url.searchParams.append(k, payload[k]);
        });
    }
    const res = await fetch(url.toString(), {
        credentials: 'include',
    });
    errorCodeHandler(res);
    const result = (await res.json()) as IResponse<R>;
    if (result.success) {
        return result.data;
    } else {
        throw new Error(result.message);
    }
}

async function postRequest<T extends IRow = IRow, R = void>(path: string, payload?: T): Promise<R> {
    const url = new URL(path);
    const headers: HeadersInit = {
        'Content-Type': 'application/json',
    };
    const res = await fetch(url.toString(), {
        method: 'POST',
        credentials: 'include',
        headers,
        body: JSON.stringify(payload),
    });
    errorCodeHandler(res);
    const result = (await res.json()) as IResponse<R>;
    if (result.success) {
        return result.data;
    } else {
        throw new Error(result.message);
    }
}

export const request = {
    get: getRequest,
    post: postRequest,
};

type Headers = Extract<HeadersInit, Record<string, string>> & {
    'Content-Type'?: 'application/json' | 'application/x-www-form-urlencoded';
};

type FetchParams<P> = P extends Record<keyof any, any> ? [
    url: string, payload: P, headers?: Headers
] : [
    url: string, payload?: unknown, headers?: Headers
];

const encodeReqBody = (body: Record<keyof any, any>, contentType: NonNullable<Headers['Content-Type']>): string => {
    if (contentType === 'application/json') {
        return JSON.stringify(body);
    }
    if (contentType === 'application/x-www-form-urlencoded') {
        return Object.entries(body).map(([k, v]) => {
            const val = v && typeof v === 'object' ? JSON.stringify(v) : v;
            return `${k}=${encodeURIComponent(val)}`;
        }).join('&');
    }
    throw new Error(`Unknown content type: ${contentType}`);
};

const initHeaders = (headers: Headers | undefined): Headers => {
    const res: HeadersInit = {
        ...headers,
    };
    return res;
};

async function getRequestV1<P = never, R = void>(
    ...params: FetchParams<P>
): Promise<IResponse<R>> {
    const [url, payload, headers] = params;

    const search = payload ? encodeReqBody(payload, 'application/x-www-form-urlencoded') : '';
    
    const res = await fetch(`${url}${search}`, {
        method: 'GET',
        credentials: 'include',
        headers: initHeaders(headers),
    });
    errorCodeHandler(res);
    return res.json();
}

async function postRequestV1<P = never, R = void>(
    ...params: FetchParams<P>
): Promise<IResponse<R>> {
    const [url, payload, headers] = params;
    const contentType = headers?.['Content-Type'] ?? 'application/json';

    const body = payload ? encodeReqBody(payload, contentType) : undefined;
    
    const res = await fetch(url, {
        method: 'POST',
        credentials: 'include',
        body,
        headers: initHeaders(headers),
    });
    errorCodeHandler(res);
    return res.json();
}

export class ApiError extends Error {
    constructor(
        public code: NonNullable<Extract<IResponse<unknown>, { success: false }>['error']>['code'] | undefined,
        public message: string,
        public options?: Record<string, string>,
    ) {
        super(`ApiError: Error code ${code || 'UNKNOWN'}. ${message}`);
    }
}

function unwrap<T>(result: IResponse<T>): T {
    if (result.success) {
        return result.data;
    }
    if (result.error) {
        throw new ApiError(result.error.code, result.message, result.error.options);
    }
    throw new Error(result.message);
}

function collectError<T>(result: IResponse<T>): [T, null] | [null, ApiError] {
    if (result.success) {
        return [result.data, null];
    }
    let err = new ApiError(result.error?.code, result.message, result.error?.options);
    if (result.error) {
        const content = intl.get(result.error.code, result.error.options) || result.message;
        err.message = `${result.error.code}: ${content}`;
        notify({
            type: 'error',
            title: result.error.code,
            content,
        });
    }
    return [null, err];
}

export const requestV1 = {
    get: getRequestV1,
    post: postRequestV1,
    unwrap,
    collectError,
};
