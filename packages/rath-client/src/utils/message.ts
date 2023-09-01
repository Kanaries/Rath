import { notify } from "../components/error";
import { PIVOT_KEYS } from "../constants";
import type { IDashboardDocumentInfo, IDatasetBase, IDatasetMeta } from "../interfaces";
import type { CommonStore } from "../store/commonStore";
import type { DataSourceStore } from "../store/dataSourceStore";
import type UserStore from "../store/userStore";


export interface IInitDataMessage {
    type: 'init_data';
    data: IDatasetBase;
}

export interface IDatasetMessage {
    type: 'dataset';
    dataset: IDatasetMeta;
    dashboard?: IDashboardDocumentInfo[];
}

export interface IDownloadMessage {
    type: 'download';
    downLoadURL: string;
}

export type IDataMessage = IInitDataMessage | IDatasetMessage | IDownloadMessage | {
    type: 'others';
    [key: string]: any;
};

export const getDataMessageHandler = (
    dataSourceStore: DataSourceStore,
    commonStore: CommonStore,
    userStore: UserStore,
) => {
    let loadTaskReceived = false;
    return async function externalMessageHandler (ev: MessageEvent<IDataMessage>): Promise<void> {
        if (loadTaskReceived) {
            return;
        }
        try {
            const { source, data: msg } = ev;
            switch (msg.type) {
                case 'download': {
                    const { downLoadURL } = msg;
                    if (downLoadURL) {
                        loadTaskReceived = true;
                        console.warn('[Get Notebook From Other Pages]', msg);
                        await userStore.openNotebook(downLoadURL);
                    } else {
                        return;
                    }
                    break;
                }
                case 'dataset': {
                    const { dataset/*, dashboard*/ } = msg;
                    if (source) {
                        loadTaskReceived = true;
                        console.warn('[Initialize From Other Pages]', msg);
                        const parts: {
                            dataset?: boolean;
                            dashboard?: boolean;
                        } = {};
                        if (dataset) {
                            parts.dataset = await userStore.openDataset(dataset);
                        }
                        // dashboard feature is not released yet
                        // if (dashboard) {
                        //     part.dashboard = await userStore.openDashboardTemplates(dashboard);
                        // }
                        // @ts-ignore
                        source.postMessage({ type: "dataset", result: parts }, ev.origin);
                        if (!parts.dataset) {
                            // dataset is not loaded successfully
                            return;
                        }
                    } else {
                        return;
                    }
                    break;
                }
                case 'init_data': {
                    if (source) {
                        const { data } = msg;
                        console.warn('[Get DataSource From Other Pages]', msg);
                        // @ts-ignore
                        source.postMessage(true, ev.origin)
                        dataSourceStore.loadDataWithInferMetas(data.dataSource, data.fields)
                        dataSourceStore.setShowDataImportSelection(false);
                    } else {
                        return;
                    }
                    break;
                }
                default: {
                    return;
                }
            }
            if (commonStore.appKey !== PIVOT_KEYS.dataSource) {
                commonStore.setAppKey(PIVOT_KEYS.dataSource);
            }
        } catch (error) {
            notify({
                type: 'error',
                title: '[externalMessageHandler] Error',
                content: `${error}`,
            });
        }
    };
};
