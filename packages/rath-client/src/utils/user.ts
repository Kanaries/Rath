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

export function getMainServiceUrl(path: string) {
    const baseURL = new URL(window.location.href);
    let default_service = 'kanaries.cn'
    if (/.*kanaries\.net$/.test(baseURL.hostname)) {
        default_service = 'kanaries.net'
    } else if (/.*kanaries\.cn$/.test(baseURL.hostname)) {
        default_service = 'kanaries.cn'
    }
    default_service = `${baseURL.protocol}//${default_service}`
    const DATA_SERVER_URL =
        baseURL.searchParams.get('main_service') || localStorage.getItem('main_service') || default_service;
    // const devSpecURL = new URL(w|| window.location.href)
    const url = new URL(DATA_SERVER_URL);
    url.pathname = path;
    return url.toString();
}

export function getDefaultAvatarURL(imgKey: string, size: 'small' | 'large' = 'large') {
    return `${DEFAULT_AVATAR_URL_PREFIX}${size}/${imgKey}`;
}

type AvatarProps = {
    avatarType: IAVATAR_TYPES;
    avatarKey: string;
    size: 'small' | 'large';
    email: string;
}

export function getAvatarURL(props: AvatarProps) {
    if (props.avatarType === IAVATAR_TYPES.default) {
        return `${DEFAULT_AVATAR_URL_PREFIX}${props.size}/${props.avatarKey}`
    }
    return ''
}
