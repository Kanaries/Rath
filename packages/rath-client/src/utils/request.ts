import { IResponse, IRow } from '../interfaces';

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
