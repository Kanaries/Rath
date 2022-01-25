import { toJS } from 'mobx';
import { observer } from 'mobx-react-lite';
import React, { useState, useEffect } from 'react';
import { useGlobalStore } from '../../../store';
import Association from './assCharts';
import { Pivot, PivotItem } from 'office-ui-fabric-react'
import intl from 'react-intl-universal';
import { Pagination } from '@material-ui/core';

const PAGE_SIZE = 7;

const ObservableAssociation: React.FC = props => {
    const { galleryStore, exploreStore } = useGlobalStore()
    const { samplingDataSource, fields, assoListT1, assoListT2 } = exploreStore;
    const { visualConfig } = galleryStore;

    const [pivotKey, setPivotKey] = useState<string>('T1')
    const [assoIndex, setAssoIndex] = useState<number>(0);

    useEffect(() => {
        setAssoIndex(0);
    }, [pivotKey, assoListT1, assoListT2])

    const assoShownFullList = pivotKey === 'T1' ? assoListT1 : assoListT2;

    const assoShownList =  assoShownFullList.slice(assoIndex * PAGE_SIZE, (assoIndex + 1) * PAGE_SIZE);

    return <div>
        <div className="state-description">{intl.get('lts.asso.hint')}</div>
        <Pivot headersOnly selectedKey={pivotKey} onLinkClick={(item) => {
            if (item && item.props.itemKey) {
                setPivotKey(item.props.itemKey)
            }
        }}>
            <PivotItem headerText={`${intl.get('lts.asso.T1')}(${assoListT1.length})`} itemKey="T1" />
            <PivotItem headerText={`${intl.get('lts.asso.T2')}(${assoListT2.length})`} itemKey="T2" />
        </Pivot>
        <Pagination count={Math.floor(assoShownFullList.length / PAGE_SIZE) + 1} page={assoIndex + 1} onChange={(e, v) => {
            setAssoIndex(Math.max(v - 1, 0));
        }} />
        <Association
            onSelectView={(viz) => {
              exploreStore.jumpToView(viz)
            }}
            dataSource={samplingDataSource}
            visualConfig={toJS(visualConfig)}
            fieldScores={fields}
            vizList={assoShownList}
          />
    </div>
}

export default observer(ObservableAssociation);