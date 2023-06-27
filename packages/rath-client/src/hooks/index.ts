import { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import produce, { Draft } from 'immer';
import intl from 'react-intl-universal';
import { CleanMethod } from '../interfaces';
import { notify } from '../components/error';
import { getMainServiceAddress } from '../utils/user';
import { request } from '../utils/request';
import { isLegalEmail } from '../utils/format';

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
    const legal = isLegalEmail(email)
    if (!legal) {
        throw new Error('illegal email format');
    }
    const url = getMainServiceAddress('/api/sendMailCert');
    const res = await request.post<{ email: string }, string>(url, { email });
    return res;
}

async function sendCertPhone(phone: string) {
    const url = getMainServiceAddress('/api/sendPhoneCert');
    const res = await request.post<{ phone: string }, string>(url, { phone });
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
                    title: intl.get('messages.email.success.title'),
                    type: 'success',
                    content: intl.get('messages.email.success.content', { email }),
                });
            })
            .catch((err) => {
                notify({
                    title: intl.get('messages.email.error.title'),
                    type: 'error',
                    content: `[/api/sendMailCert] ${err}`,
                });
            });
        const int = setInterval(() => {
            setClock((c) => {
                const nextC = c - 1;
                if (nextC === 0) {
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
                    title: intl.get('messages.phone.success.title'),
                    type: 'success',
                    content: intl.get('messages.phone.success.content', { phone }),
                });
            })
            .catch((err) => {
                notify({
                    title: intl.get('messages.phone.error.title'),
                    type: 'error',
                    content: `[/api/sendPhoneCert] ${err}`,
                });
            });
        const int = setInterval(() => {
            setClock((c) => {
                const nextC = c - 1;
                if (nextC === 0) {
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
