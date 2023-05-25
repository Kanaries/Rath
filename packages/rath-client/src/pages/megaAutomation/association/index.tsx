import { toJS } from 'mobx';
import { observer } from 'mobx-react-lite';
import React, { useState, useEffect } from 'react';
import { Pivot, PivotItem } from '@fluentui/react'
import intl from 'react-intl-universal';
import { useGlobalStore } from '../../../store';
import Pagination from '../../../components/pagination';
import Association from './assCharts';

const PAGE_SIZE = 7;

const ObservableAssociation: React.FC = props => {
    const {  megaAutoStore, commonStore } = useGlobalStore()
    const { samplingDataSource,  assoListT1, assoListT2, visualConfig, fieldMetas } = megaAutoStore;

    const [pivotKey, setPivotKey] = useState<string>('T1')
    const [assoIndex, setAssoIndex] = useState<number>(0);

    useEffect(() => {
        setAssoIndex(0);
    }, [pivotKey, assoListT1, assoListT2])

    const assoShownFullList = pivotKey === 'T1' ? assoListT1 : assoListT2;

    const assoShownList =  assoShownFullList.slice(assoIndex * PAGE_SIZE, (assoIndex + 1) * PAGE_SIZE);

    return <div>
        <div className="state-description">{intl.get('megaAuto.asso.hint')}</div>
        <Pivot headersOnly selectedKey={pivotKey} onLinkClick={(item) => {
            if (item && item.props.itemKey) {
                setPivotKey(item.props.itemKey)
            }
        }}>
            <PivotItem headerText={`${intl.get('megaAuto.asso.T1')}(${assoListT1.length})`} itemKey="T1" />
            <PivotItem headerText={`${intl.get('megaAuto.asso.T2')}(${assoListT2.length})`} itemKey="T2" />
        </Pivot>
        <Pagination pageCount={Math.floor(assoShownFullList.length / PAGE_SIZE) + 1} pageIdx={assoIndex + 1} onChange={v => {
            setAssoIndex(Math.max(v - 1, 0));
        }} />
        <Association
            onSelectView={(viz) => {
              megaAutoStore.jumpToView(viz)
            }}
            dataSource={samplingDataSource}
            visualConfig={toJS(visualConfig)}
            fieldMetas={fieldMetas}
            vizList={assoShownList}
            themeConfig={commonStore.themeConfig}
          />
    </div>
}

export default observer(ObservableAssociation);