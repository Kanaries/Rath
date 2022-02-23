interface IObject {
    [key: string]: any;
}
function deepFrom (obj: any, keys: string[], depth: number): any {
    const currentKey = keys[depth];
    const hasKey = currentKey in obj;
    if (!(obj instanceof Object) && depth < keys.length - 1) {
        return null;
    }
    if (obj instanceof Object && !(currentKey in obj)) {
        return null;
    }
    if (depth === keys.length - 1) {
        return obj[currentKey];
    }
    return deepFrom(obj[currentKey], keys, depth + 1);
}

class LangIntl {
    private locales: { [key: string]: any } = {}
    private currentLocale: string = 'zh-CN';
    private deepGet (keyStr: string) {
        const locale = this.locales[this.currentLocale];
        if (keyStr in locale) {
            const keys = keyStr.split('.');
            const value = deepFrom(locale, keys, 0);
            if (value === null) {
                console.warn('kv不匹配');
                return '';
            }
            return value;
        }
        console.warn('locale 资源未加载.')
        return ''
    }
    public get (keyStr: string) {
        return this.deepGet(keyStr)
    }
    private initFromBrowser() {
        return navigator.language;
    }
    public init () {
        this.currentLocale = this.initFromBrowser();
    }
}
function intl () {

}
export default intl;