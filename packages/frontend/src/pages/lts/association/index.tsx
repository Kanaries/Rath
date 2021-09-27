import { toJS } from 'mobx';
import { observer } from 'mobx-react-lite';
import React from 'react';
import { FieldSummary } from '../../../service';
import { useGlobalStore } from '../../../store';
import Association from './assCharts';

const ObservableAssociation: React.FC = props => {
    const { galleryStore, exploreStore } = useGlobalStore()
    const { dataSource, insightSpaces, fields, assoListT1, assoListT2 } = exploreStore;
    const { visualConfig } = galleryStore;

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

    const viewSpaces = insightSpaces.map((space, i) => ({
        ...space,
        score: typeof space.score === 'number' ? space.score : 0,
        index: i
    }))

    return <div>
        asso content {assoListT1.length} + {assoListT2.length}
        <Association
            onSelectView={(index) => {
              let pos = viewSpaces.findIndex((v) => v.index === index)
              if (pos > -1) {
                // galleryStore.goToPage(pos)
                // tmpStore.
              }
            }}
            dataSource={dataSource}
            visualConfig={toJS(visualConfig)}
            fieldScores={fieldScores}
            vizList={assoListT2.slice(0, 5)}
          />
          <Association
            onSelectView={(index) => {
              let pos = viewSpaces.findIndex((v) => v.index === index)
              if (pos > -1) {
                // galleryStore.goToPage(pos)
                // tmpStore.
              }
            }}
            dataSource={dataSource}
            visualConfig={toJS(visualConfig)}
            fieldScores={fieldScores}
            vizList={assoListT1.slice(0, 5)}
          />
    </div>
}

export default observer(ObservableAssociation);