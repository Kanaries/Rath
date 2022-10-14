import produce from 'immer';
import { observer } from 'mobx-react-lite';
import React, { useMemo } from 'react';
import styled from 'styled-components';
import ReactVega from '../../components/react-vega';
import { IResizeMode, IVegaSubset } from '../../interfaces';
import { applySizeConfig } from '../../queries/base/utils';
import { useGlobalStore } from '../../store';
import VisErrorBoundary from '../../visBuilder/visErrorBoundary';
import { baseDemoSample } from '../painter/sample';

const CollectContainer = styled.div`
    display: flex;
    flex-wrap: wrap;
    .chart-container{
        border: 1px solid #b0b0b0;
        border-radius: 1em;
        padding: 1em;
        margin: 1em;
    }
`;

function changeVisSize (spec: IVegaSubset): IVegaSubset {
    const nextSpec = produce(spec, draft => {
        applySizeConfig(draft, {
            mode: IResizeMode.control,
            width: 360,
            height: 280,
            hasFacets: Boolean(spec.encoding.row || spec.encoding.column)
        })
    })  
    return nextSpec;
}

const Collection: React.FC = (props) => {
    const { collectionStore, dataSourceStore } = useGlobalStore();
    const { cleanedData } = dataSourceStore;
    const sampleData = useMemo(() => {
        if (cleanedData.length > 5000) return cleanedData;
        return baseDemoSample(cleanedData, 5000)
    }, [cleanedData])
    return (
        <div className="content-container">
            <div className="card">
                <CollectContainer>
                    {collectionStore.collectionList.map((item, i) => (
                        <div className="chart-container" key={item.viewId}>
                            <VisErrorBoundary>
                                <ReactVega
                                    dataSource={sampleData}
                                    spec={changeVisSize(item.spec)}
                                    actions={false}
                                />
                            </VisErrorBoundary>
                        </div>
                    ))}
                </CollectContainer>
            </div>
        </div>
    );
};

export default observer(Collection);
