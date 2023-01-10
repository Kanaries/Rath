import { RathEnv, RATH_ENV } from "../constants";

export enum IAVATAR_TYPES {
    gravatar = 'gravatar',
    default = 'default'
}

// 此模块与 Rath 其他部分单向解耦，
// 不要在这里添加对其他模块的依赖（包括 types, constants 和 utils），
// 或将应当置于此模块的内容拆移到外部。
// 一部分语句（如下方的 赋值表达式[右值 = 成员表达式]）
// 如果侵入到其他（被 worker 依赖的）模块有可能被经过 loader 错误打包，
// 导致所有 Web Workers 无法注册。

export const AVATAR_IMG_LIST: string[] = new Array(18)
    .fill(0)
    .map((_, i) => `avatar-B-${`${i + 1}`.padStart(2, '0')}.png`);

export const DEFAULT_AVATAR_URL_PREFIX = 'https://foghorn-assets.s3.ap-northeast-1.amazonaws.com/avatar/';

const DEFAULT_MAIN_SERVER_HOST = `${
    window.location.host.match(/kanaries\.[a-z]+$/i)?.[0] ?? 'kanaries.net'
}`;

export function getMainServiceAddress(path: string) {
    const baseURL = new URL(window.location.href);
    const CONFIGURABLE_MAIN_SERVER_URL = RathEnv === RATH_ENV.ONLINE ? null
        : baseURL.searchParams.get('main_service') || localStorage.getItem('main_service');
    const serverUrl = CONFIGURABLE_MAIN_SERVER_URL ?? `${baseURL.protocol}//${DEFAULT_MAIN_SERVER_HOST}`;
    const url = new URL(serverUrl);
    url.pathname = path;
    return url.toString();
}
