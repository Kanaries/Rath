function getURIConfig(name: string, _default: any) {
    return decodeURIComponent(
        new URL(window.location.href).searchParams
            .get(name) ?? _default
    )
}
interface TestConfig {
    useIndexUpdate: boolean,
    useRenderer: 'painter' | 'webgl' | 'canvas' | 'svg' | 'png',
    useGlobalChangeset: boolean,
    printLog: boolean
}
const testConfig: TestConfig = {
    useIndexUpdate: true,
    useRenderer: 'painter', // 'painter' | 'webgl' | 'canvas' | 'svg' | 'png'
    useGlobalChangeset: true,
    printLog: false,
}
let config: {[k: string]: any} = {};
for (let key in testConfig) {
    const value = testConfig[key as keyof TestConfig];
    let v;
    if (typeof value === 'string') {
        v = getURIConfig(key, value);
    }
    else if (typeof value === 'boolean') {
        v = getURIConfig(key, value ? 'true' : 'false') === 'true';
    }
    else if (typeof value === 'number') {
        v = Number(getURIConfig(key, value));
    }
    config[key] = v;
}
Object.assign(testConfig, config);

export {testConfig, type TestConfig};