import { observer } from 'mobx-react-lite';
import React, { useCallback, useState } from 'react';
import DashboardList from './dashboard-list';
import DashboardDetail from './dashboard-detail';


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

    return path.page === 'list'
        ? <DashboardList openDocument={openDocument} />
        : <DashboardDetail cursor={path.cursor} goBack={showList} />;
};

export default observer(Dashboard);
