import { makeAutoObservable, runInAction } from "mobx";
import intl from 'react-intl-universal';
import { SUPPORT_LANG } from "../locales";
import { notify } from "../components/error";
import { loadRathErrorLocales } from "../rath-error";

export class LangStore {
    public lang: string = SUPPORT_LANG[0].value;
    public loaded: boolean = true;
    constructor () {
        this.initLocales();
        makeAutoObservable(this)
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
            const errorMsgLocales = loadRathErrorLocales(lang);
            await intl.init({
                currentLocale: lang,
                locales: {
                    [lang]: {
                        ...result,
                        error: errorMsgLocales,
                    },
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