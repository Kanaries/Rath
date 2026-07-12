import { observer } from 'mobx-react-lite';
import React from 'react';
import { Progress } from '../../components/ui/progress';
import { useGlobalStore } from '../../store';

const DataLoadingStatus: React.FC = props => {
    const { dataSourceStore } = useGlobalStore();
    const { loadingDataProgress } = dataSourceStore
    return <div className="space-y-1">
        <span className="text-xs text-muted-foreground">loading</span>
        <Progress value={loadingDataProgress * 100} />
    </div>
}

export default observer(DataLoadingStatus);
