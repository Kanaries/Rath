import { toJS } from 'mobx';
import { observer } from 'mobx-react-lite';
import React, { useState } from 'react';
import { FieldSummary } from '../../../service';
import { useGlobalStore } from '../../../store';
import Association from './assCharts';
import { Pivot, PivotItem } from 'office-ui-fabric-react'
import intl from 'react-intl-universal';

const ObservableAssociation: React.FC = props => {
    const { galleryStore, exploreStore } = useGlobalStore()
    const { dataSource, fields, assoListT1, assoListT2 } = exploreStore;
    const { visualConfig } = galleryStore;

    const [pivotKey, setPivotKey] = useState<string>('T1')

    const fieldScores: FieldSummary[] = fields.map(f => {
        const distribution = [...f.domain.entries()].map(c => ({
            memberName: c[0],
            count: c[1]
        }))
        return ({
            fieldName: f.key,
            distribution,
            entropy: f.features.entropy,
            maxEntropy: f.features.maxEntropy,
            type: f.semanticType
        })
    })

    const assoShownList = pivotKey === 'T1' ? assoListT1.slice(0, 5) : assoListT2.slice(0, 5)

    return <div>
        <div className="state-description">{intl.get('lts.asso.hint')}</div>
        <Pivot headersOnly selectedKey={pivotKey} onLinkClick={(item) => {
            if (item && item.props.itemKey) {
                setPivotKey(item.props.itemKey)
            }
        }}>
            <PivotItem headerText={intl.get('lts.asso.T1')} itemKey="T1" />
            <PivotItem headerText={intl.get('lts.asso.T2')} itemKey="T2" />
        </Pivot>
        <Association
            onSelectView={(viz) => {
              exploreStore.jumpToView(viz)
            }}
            dataSource={dataSource}
            visualConfig={toJS(visualConfig)}
            fieldScores={fieldScores}
            vizList={assoShownList}
          />
    </div>
}

export default observer(ObservableAssociation);