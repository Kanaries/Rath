import { makeAutoObservable, runInAction } from "mobx";
import { SUPPORT_LANG } from "../locales";
import intl from 'react-intl-universal';

export class LangStore {
    public lang: string = SUPPORT_LANG[0].value;
    public loaded: boolean = false;
    constructor () {
        makeAutoObservable(this)
        this.initLocales();
    }
    public async useLocales (lang: string) {
        try {
            const res = await fetch(`locales/${lang}.json`, {
                method: "GET",
                headers: {
                    "Content-Type": "application/json",
                },
            });
            const result = await res.json();
            await intl.init({
                currentLocale: lang,
                locales: {
                    [lang]: result,
                },
            });
            runInAction(() => {
                this.lang = lang
                this.loaded = true;
            })
        } catch (error) {
            console.error(error);
        }
    }
    public async initLocales () {
        let currentLocale = intl.determineLocale({
            urlLocaleKey: "lang",
            cookieLocaleKey: "lang",
        });
        if (!SUPPORT_LANG.find((f) => f.value === currentLocale)) {
            currentLocale = SUPPORT_LANG[0].value;
        }
        await this.useLocales(currentLocale);
    }
}