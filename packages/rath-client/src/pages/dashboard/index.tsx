import { observer } from 'mobx-react-lite';
import React, { useCallback, useState } from 'react';
import DashboardHomepage from './dashboard-homepage';
import DashboardDetail from './dashboard-detail';
import { scaleRatio } from './renderer/constant';

const Dashboard: React.FC = () => {
    const [path, setPath] = useState<{
        page: 'list' | 'detail';
        cursor: number;
    }>({
        page: 'list',
        cursor: -1,
    });

    const openDocument = useCallback((index: number) => {
        setPath({
            page: 'detail',
            cursor: index,
        });
    }, []);

    const showList = useCallback(() => {
        setPath({
            page: 'list',
            cursor: -1,
        });
    }, []);

    return path.page === 'list' ? (
        <DashboardHomepage openDocument={openDocument} />
    ) : (
        <DashboardDetail sampleSize={1_000} cursor={path.cursor} goBack={showList} ratio={scaleRatio} />
    );
};

export default observer(Dashboard);
