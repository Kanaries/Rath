import { toJS } from 'mobx';
import { observer } from 'mobx-react-lite';
import React, { useState, useEffect } from 'react';
import intl from 'react-intl-universal';
import { useGlobalStore } from '../../../store';
import Pagination from '../../../components/pagination';
import { Tabs, TabsList, TabsTrigger } from '../../../components/ui/tabs';
import Association from './assCharts';

const PAGE_SIZE = 7;

const ObservableAssociation: React.FC = (props) => {
    const { megaAutoStore, commonStore } = useGlobalStore();
    const { samplingDataSource, assoListT1, assoListT2, visualConfig, fieldMetas } = megaAutoStore;

    const [pivotKey, setPivotKey] = useState<string>('T1');
    const [assoIndex, setAssoIndex] = useState<number>(0);

    useEffect(() => {
        setAssoIndex(0);
    }, [pivotKey, assoListT1, assoListT2]);

    const assoShownFullList = pivotKey === 'T1' ? assoListT1 : assoListT2;

    const assoShownList = assoShownFullList.slice(assoIndex * PAGE_SIZE, (assoIndex + 1) * PAGE_SIZE);

    return (
        <div>
            <div className="state-description">{intl.get('megaAuto.asso.hint')}</div>
            <Tabs value={pivotKey} onValueChange={setPivotKey}>
                <TabsList>
                    <TabsTrigger value="T1">{`${intl.get('megaAuto.asso.T1')}(${assoListT1.length})`}</TabsTrigger>
                    <TabsTrigger value="T2">{`${intl.get('megaAuto.asso.T2')}(${assoListT2.length})`}</TabsTrigger>
                </TabsList>
            </Tabs>
            <Pagination
                pageCount={Math.floor(assoShownFullList.length / PAGE_SIZE) + 1}
                pageIdx={assoIndex + 1}
                onChange={(v) => {
                    setAssoIndex(Math.max(v - 1, 0));
                }}
            />
            <Association
                onSelectView={(viz) => {
                    megaAutoStore.jumpToView(viz);
                }}
                dataSource={samplingDataSource}
                visualConfig={toJS(visualConfig)}
                fieldMetas={fieldMetas}
                vizList={assoShownList}
                themeConfig={commonStore.themeConfig}
            />
        </div>
    );
};

export default observer(ObservableAssociation);
