import { IResponse, IRow } from '../interfaces';

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
    const res = await fetch(url.toString(), {
        method: 'POST',
        credentials: 'include',
        headers: {
            'Content-Type': 'application/json',
        },
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
