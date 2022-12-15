import { makeAutoObservable, runInAction } from "mobx";
import intl from 'react-intl-universal';
import { nanoid } from "nanoid";
import { SUPPORT_LANG } from "../locales";
import { notify } from "../components/error";
import { loadRathErrorLocales } from "../rath-error";
import { setup as setupCausalLocales } from "../pages/causal/locales";


export type I18nSchema = {
    [key: string]: string | I18nSchema;
};

export type I18nSetupFunction = (lang: string, id: string) => I18nSchema;

const mergeI18nSchemas = (lang: string, baseSchema: I18nSchema, setupFunctions: I18nSetupFunction[]): I18nSchema => {
    const schema = { ...baseSchema };
    for (const setup of setupFunctions) {
        const id = nanoid(6);
        schema[id] = setup(lang, id);
    }
    return schema;
};

export class LangStore {
    public lang: string = SUPPORT_LANG[0].value;
    public loaded: boolean = true;
    constructor () {
        makeAutoObservable(this)
        this.initLocales();
    }
    public async useLocales (lang: string) {
        try {
            this.loaded = false;
            const res = await fetch(`locales/${lang}.json`, {
                method: "GET",
                headers: {
                    "Content-Type": "application/json",
                },
            });
            localStorage.setItem('lang', lang);
            const result = await res.json();
            const locales = mergeI18nSchemas(lang, result, [loadRathErrorLocales, setupCausalLocales]);
            await intl.init({
                currentLocale: lang,
                locales: {
                    [lang]: locales,
                },
            });
            runInAction(() => {
                this.lang = lang
                this.loaded = true;
            })
        } catch (error) {
            notify({
                title: 'Language Init Error',
                type: 'error',
                content: `[lang i18n error] ${error}`
            })
        }
    }
    public setLocale (lang: string) {
        this.lang = lang;
        localStorage.setItem('lang', lang);
    }
    public async changeLocalesAndReload (lang: string) {
        // this.useLocales(lang);
        this.setLocale(lang);
        window.location.reload();
    }
    public async initLocales () {
        let currentLocale = intl.determineLocale({
            urlLocaleKey: "lang",
            cookieLocaleKey: "lang",
            localStorageLocaleKey: "lang"
        });
        if (!SUPPORT_LANG.find((f) => f.value === currentLocale)) {
            currentLocale = SUPPORT_LANG[0].value;
        }
        await this.useLocales(currentLocale);
    }
}