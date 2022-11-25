import { observer } from 'mobx-react-lite';
import React, { useEffect } from 'react';
import { useGlobalStore } from '../../../store';
import type { useDataViews } from '../hooks/dataViews';
import DatasetPanel from '../datasetPanel';


export interface CausalDatasetConfigProps {
    dataContext: ReturnType<typeof useDataViews>;
}

const CausalDatasetConfig: React.FC<CausalDatasetConfigProps> = ({ dataContext }) => {
    const { dataSourceStore, causalStore } = useGlobalStore();
    const { fieldMetas } = dataSourceStore;

    useEffect(() => {
        causalStore.updateCausalAlgorithmList(fieldMetas);
    }, [causalStore, fieldMetas]);

    return (
        <>
            <DatasetPanel context={dataContext} />
        </>
    );
};

export default observer(CausalDatasetConfig);
