import { observer } from 'mobx-react-lite';
import React from 'react';
import { useEffect } from 'react';
import { useState } from 'react';
import { useGlobalStore } from '../../store';
import BaseChart from '../../visBuilder/vegaBase';

const LTSPage: React.FC = props => {
    const { ltsPipeLineStore, dataSourceStore } = useGlobalStore();
    const { insightSpaces } = ltsPipeLineStore;
    const [pageIndex, setPageIndex] = useState(0);
    const [isAgg, setIsAgg] = useState(true);
    useEffect(() => {
        ltsPipeLineStore.startTask();
    }, [])
    const spec = ltsPipeLineStore.specify(pageIndex);
    return <div>
        <button onClick={() => {
            setPageIndex(p => (p + 1) % insightSpaces.length)
        }}>next</button>
        <button onClick={() => {
            setIsAgg(a => !a)
        }}>agg: {isAgg}</button>
        <h1>subspaces length: {insightSpaces.length}</h1>
        <div>
            view {pageIndex} {insightSpaces.length > 0 && insightSpaces[pageIndex].score}:
            <div>
                {insightSpaces.length > 0 && spec && <div>
                    <BaseChart
                        defaultAggregated={isAgg}
                        defaultStack={true}
                        dimensions={insightSpaces[pageIndex].dimensions}
                        measures={insightSpaces[pageIndex].measures}
                        dataSource={dataSourceStore.cleanedData}
                        schema={spec.schema}
                        fieldFeatures={dataSourceStore.fieldMetas.map(f => ({
                            name: f.fid,
                            type: f.semanticType
                        }))}
                        aggregator="sum"
                    />
                </div>}
            </div>
        </div>
    </div>
}

export default observer(LTSPage);