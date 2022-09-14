import { observer } from 'mobx-react-lite';
import { ProgressIndicator } from '@fluentui/react';
import React from 'react';
import { useGlobalStore } from '../../store';

const DataLoadingStatus: React.FC = props => {
    const { dataSourceStore } = useGlobalStore();
    const { loadingDataProgress } = dataSourceStore
    return <div>
        <ProgressIndicator description="loading" percentComplete={loadingDataProgress} />
    </div>
}

export default observer(DataLoadingStatus);
