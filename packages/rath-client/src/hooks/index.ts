import { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import produce, { Draft } from 'immer';
import intl from 'react-intl-universal';
import { CleanMethod } from '../interfaces';
import { notify } from '../components/error';
import { getServerUrl } from '../utils/user';
import { request } from '../utils/request';

/**
 * @param S type of the composed state
 */
export type StateUpdater<S> = (draftState: Draft<S>) => void;
/**
 *
 * @param initState
 * useComposeState helps you manage several state together, provided with immutable state change api
 *
 * example:
 * ```js
 * const [state, setState] = useComposeState({foo: 12, bar: { foo: 20}})
 * setState(draft => {
 *  draft.bar.foo = 100;
 * })
 * ```
 */
export function useComposeState<S>(initState: S): [S, (stateUpdater: StateUpdater<S>) => void] {
    const [state, setState] = useState<S>(initState);
    const updateState = useCallback(
        (stateUpdater: StateUpdater<S>) => {
            setState((state) => {
                const nextState = produce<S>(state, (draftState) => stateUpdater(draftState));
                return nextState;
            });
        },
        [setState]
    );
    return [state, updateState];
}

export const cleanMethodList: Array<{ key: CleanMethod; text: string }> = [
    { key: 'dropNull', text: 'drop null records' },
    { key: 'useMode', text: 'replace null with mode' },
    { key: 'simpleClean', text: 'simple cleaning' },
    { key: 'none', text: 'none' },
];

export const useCleanMethodList = function (): typeof cleanMethodList {
    return useMemo(() => {
        return cleanMethodList.map((m) => {
            return {
                key: m.key,
                text: intl.get(`dataSource.methods.${m.key}`),
            };
        });
    }, []);
};

async function sendCertMail(email: string) {
    const url = getServerUrl('/api/sendMailCert');
    // TODO: email格式检查
    const res = await request.post<{ email: string }, string>(url, { email });
    if (res) {
        // console.log("邮件发送成功");
    }
    return res;
}

async function sendCertPhone(phone: string) {
    const url = getServerUrl('/api/sendPhoneCert');
    // TODO: email格式检查
    const res = await request.post<{ phone: string }, string>(url, { phone });
    if (res) {
        // console.log("短信发送成功");
    }
    return res;
}

export function useCertMail(email: string) {
    const [clock, setClock] = useState<number>(0);
    const timerRef = useRef<NodeJS.Timeout>();
    const startClock = useCallback(() => {
        setClock(60);
        sendCertMail(email)
            .then((res) => {
                notify({
                    title: '邮件发送成功',
                    type: 'success',
                    content: `邮箱已发送至${email}，请检查。`,
                });
            })
            .catch((err) => {
                notify({
                    title: '发生错误',
                    type: 'error',
                    content: `[/api/sendMailCert] ${err}`,
                });
            });
        const int = setInterval(() => {
            setClock((c) => {
                const nextC = c - 1;
                if (nextC === 0) {
                    // console.log('[kanaries log] clock interval is cleared.');
                    clearInterval(int);
                    timerRef.current = undefined;
                }
                return nextC;
            });
        }, 1000);
        timerRef.current = int;
    }, [email]);
    useEffect(() => {
        return () => {
            const { current: timer } = timerRef;
            if (timer) {
                clearInterval(timer);
                timerRef.current = undefined;
            }
        };
    }, []);
    return {
        clock,
        startClock,
    };
}

export function useCertPhone(phone: string) {
    const [clock, setClock] = useState<number>(0);
    const startClock = useCallback(() => {
        setClock(60);
        sendCertPhone(phone)
            .then((res) => {
                notify({
                    title: '短信发送成功',
                    type: 'success',
                    content: `短信已发送至${phone}，请检查。`,
                });
            })
            .catch((err) => {
                notify({
                    title: '发生错误',
                    type: 'error',
                    content: `[/api/sendPhoneCert] ${err}`,
                });
            });
        const int = setInterval(() => {
            setClock((c) => {
                const nextC = c - 1;
                if (nextC === 0) {
                    // console.log('[kanaries log] clock interval is cleared.');
                    clearInterval(int);
                }
                return nextC;
            });
        }, 1000);
    }, [phone]);
    return {
        clock,
        startClock,
    };
}
