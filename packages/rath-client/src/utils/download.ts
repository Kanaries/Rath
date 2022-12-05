export function downloadFileWithContent(content: string, fileName: string) {
    const ele = document.createElement('a');
    ele.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(content));
    ele.setAttribute('download', fileName);
    ele.style.display = 'none';
    document.body.appendChild(ele);
    ele.click();

    document.body.removeChild(ele);
}

export function downloadFileFromBlob(content: Blob, fileName: string) {
    const ele = document.createElement('a');
    ele.setAttribute('href', URL.createObjectURL(content));
    ele.setAttribute('download', fileName);
    ele.style.display = 'none';
    document.body.appendChild(ele);
    ele.click();

    document.body.removeChild(ele);
}

export enum IKRFComponents {
    data = 'data',
    meta = 'meta',
    collection = 'collection',
    causal = 'causal',
    dashboard = 'dashboard',
    mega = 'mega',
}
export function getKRFParseMap (props: { [key in IKRFComponents]: boolean }): { [key in IKRFComponents]?: string } {
    const parseMap: { [key in IKRFComponents]?: string } = {};
    Object.keys(props).forEach((key) => {
        if (props[key as IKRFComponents]) {
            parseMap[key as IKRFComponents] = `rath_${IKRFComponents[key as IKRFComponents]}.json`;
        }
    });
    return parseMap
}

export const KRF_VERSION = '0.0.1'