import { getServerUrl } from '../utils';
import { ILoginForm } from './commonStore';

export async function liteAuthService(props: { certCode: string; certMethod: 'email' | 'phone'; certAddress: string }) {
    const url = getServerUrl('/api/liteAuth');
    const res = await fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(props),
    });
    const result = await res.json();
    if (result.code === 200) {
        return result.data;
    } else {
        throw new Error(`[/source/list] ${result.message}`);
    }
}

export async function commitLoginService(props: ILoginForm) {
    const url = getServerUrl('/api/login');
    const res = await fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(props),
    });
    const result = await res.json();
    if (result.code === 200) {
        return result.data;
    } else {
        throw new Error(`[/source/list] ${result.message}`);
    }
}
