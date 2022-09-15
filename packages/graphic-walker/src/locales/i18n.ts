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

export const setLocaleLanguage = (lang: string) => {
    // Object.hasOwn() is not supported yet
    if (locales.hasOwnProperty(lang)) { // if (Object.hasOwn(locales, lang)) {
        return i18n.changeLanguage(lang);
    }

    return i18n.changeLanguage('en-US');
}
