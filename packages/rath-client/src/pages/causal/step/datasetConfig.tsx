import { observer } from 'mobx-react-lite';
import type { FC } from 'react';
import DatasetPanel from '../datasetPanel';


const CausalDatasetConfig: FC = () => {
    return (
        <>
            <DatasetPanel />
        </>
    );
};

export default observer(CausalDatasetConfig);
