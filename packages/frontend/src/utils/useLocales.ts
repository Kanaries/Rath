import { useCallback } from "react";
import intl from 'react-intl-universal';
export function useLocales (callback: (lang: string) => void) {
    const loadLocales = useCallback((lang: string) => {
        fetch(`locales/${lang}.json`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            }
        })
        .then(res => res.json())
        .then(res => {
            return intl.init({
                currentLocale: lang,
                locales: {
                    [lang]: res
                }
            })
        })
        .then(() => {
            callback(lang)
        })
    }, [callback]);
    return loadLocales
}