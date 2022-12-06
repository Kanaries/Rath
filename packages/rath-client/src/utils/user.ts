export function getServerUrl(path: string) {
    const baseURL = new URL(window.location.href);
    const DATA_SERVER_URL =
        baseURL.searchParams.get('main_service') || localStorage.getItem('main_service') || window.location.href;
    // const devSpecURL = new URL(w|| window.location.href)
    const url = new URL(DATA_SERVER_URL);
    url.pathname = path;
    return url.toString();
}
