import { observer } from 'mobx-react-lite';
import React from 'react';
import type { useDataViews } from '../hooks/dataViews';
import DatasetPanel from '../datasetPanel';


export interface CausalDatasetConfigProps {
    dataContext: ReturnType<typeof useDataViews>;
}

const CausalDatasetConfig: React.FC<CausalDatasetConfigProps> = ({ dataContext }) => {
    return (
        <>
            <DatasetPanel context={dataContext} />
        </>
    );
};

export default observer(CausalDatasetConfig);
