import i18n, { Resource } from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

import localeEnUs from './en-US.json';
import localeZhCn from './zh-CN.json';


const locales: Resource & { 'en-US': any } = {
    'en': {
        translation: localeEnUs,
    },
    'en-US': {
        translation: localeEnUs,
    },
    'zh': {
        translation: localeZhCn,
    },
    'zh-CN': {
        translation: localeZhCn,
    },
} as const;

i18n.use(initReactI18next).use(LanguageDetector).init({
    fallbackLng: 'en-US',
    interpolation: {
        escapeValue: false, // not needed for react as it escapes by default
    },
    resources: locales,
});

const loadedLangs: string[] = []; // exclude built-in keys to enable rewrite

export const mergeLocaleRes = (resources: { [lang: string]: Resource }) => {
    for (const lang in resources) {
        if (Object.prototype.hasOwnProperty.call(resources, lang)) {
            if (loadedLangs.includes(lang)) {
                continue;
            }

            loadedLangs.push(lang);
            const resource = resources[lang];
            i18n.addResourceBundle(lang, 'translation', resource, false, true);
        }
    }
};

export const setLocaleLanguage = (lang: string) => {
    return i18n.changeLanguage(lang);
};
