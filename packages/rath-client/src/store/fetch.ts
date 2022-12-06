import { getServerUrl } from '../utils/user';
import type { ILoginForm } from './userStore';

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
    if (res.status === 200) {
        return result as (
            | { success: true; data: boolean }
            | { success: false; message: string }
        );
    } else {
        throw new Error(`[/api/login] ${result.message}`);
    }
}
