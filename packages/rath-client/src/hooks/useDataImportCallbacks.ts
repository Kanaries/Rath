import { useCallback } from 'react';
import { useGlobalStore } from '../store';
import { notify } from '../components/error';
import type { IMuteFieldBase, IRow } from '../interfaces';
import type { DataSourceTag, IDBMeta } from '../utils/storage';
import { setDataStorage } from '../utils/storage';

export function useDataImportCallbacks(options?: { onClose?: () => void }) {
    const { dataSourceStore, megaAutoStore, semiAutoStore } = useGlobalStore();
    const onClose = options?.onClose;

    const onSelectDataLoaded = useCallback(
        (fields: IMuteFieldBase[], dataSource: IRow[], name?: string, tag?: DataSourceTag, withHistory?: IDBMeta) => {
            megaAutoStore.init();
            semiAutoStore.init();
            dataSourceStore.loadDataWithInferMetas(dataSource, fields, tag);
            if (name && tag !== undefined) {
                dataSourceStore.setDatasetId(name);
                setDataStorage(name, fields, dataSource, tag, withHistory);
            }
            onClose?.();
        },
        [dataSourceStore, megaAutoStore, semiAutoStore, onClose],
    );

    const onSelectStartLoading = useCallback(() => {
        dataSourceStore.setLoading(true);
    }, [dataSourceStore]);

    const onLoadingFailed = useCallback((err: unknown) => {
        dataSourceStore.setLoading(false);
        notify({
            type: 'error',
            title: '[Data Loading Error]',
            content: err instanceof Error ? err.message : String(err),
        });
    }, [dataSourceStore]);

    const toggleLoadingAnimation = useCallback((on: boolean) => {
        dataSourceStore.setLoading(on);
    }, [dataSourceStore]);

    const onDataLoading = useCallback((p: number) => {
        dataSourceStore.setLoadingDataProgress(Math.floor(p * 100) / 100);
    }, [dataSourceStore]);

    return {
        onSelectDataLoaded,
        onSelectStartLoading,
        onLoadingFailed,
        toggleLoadingAnimation,
        onDataLoading,
        loading: dataSourceStore.loading,
    };
}
