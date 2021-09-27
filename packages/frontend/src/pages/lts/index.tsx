import { observer } from 'mobx-react-lite';
import { DefaultButton, PrimaryButton, Toggle, Stack } from 'office-ui-fabric-react';
import React, { useEffect, useState } from 'react';
import { useGlobalStore } from '../../store';
import BaseChart from '../../visBuilder/vegaBase';
import RadarChart from '../../components/radarChart';
import Ass from './association/index'

const LTSPage: React.FC = props => {
    const { ltsPipeLineStore, dataSourceStore, exploreStore } = useGlobalStore();
    const { insightSpaces } = ltsPipeLineStore;

    const { pageIndex, aggState, spec, showAsso } = exploreStore;

    return <div className="content-container">
        <div className="card">
            <Stack horizontal>
                <PrimaryButton
                    text="Analysis"
                    disabled={dataSourceStore.cleanedData.length === 0}
                    onClick={() => {
                        ltsPipeLineStore.startTask().then(() => {
                            exploreStore.emitViewChangeTransaction(0)
                        })
                    }}
                />
                <DefaultButton
                    style={{ marginLeft: "10px" }}
                    text="←"
                    onClick={() => {
                        exploreStore.emitViewChangeTransaction((pageIndex - 1 + insightSpaces.length) % insightSpaces.length)
                    }}
                />
                <DefaultButton
                    style={{ marginLeft: "10px" }}
                    text="→"
                    onClick={() => {
                        exploreStore.emitViewChangeTransaction((pageIndex + 1) % insightSpaces.length)
                    }}
                />
            </Stack>
            <Toggle
                checked={aggState}
                onText="On"
                offText="Off"
                label="Default Aggregate"
                onChange={(e, checked) => {
                    exploreStore.setAggState(Boolean(checked))
                }}
            />
            <h2>Visual Insights(v2 engine β)</h2>
            <div>
                <p className="state-description">results: {pageIndex + 1} / {insightSpaces.length}. score: {insightSpaces.length > 0 && insightSpaces[pageIndex].score?.toFixed(2)}</p>
                <div>
                    {insightSpaces.length > 0 && spec && <div>
                        <BaseChart
                            defaultAggregated={aggState}
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
                    {
                        insightSpaces.length > 0 && spec && <div>
                            <PrimaryButton text="details" onClick={() => {exploreStore.scanDetails(pageIndex)}} />
                            <PrimaryButton style={{ marginLeft: '1em' }} text="Associate" onClick={() => {exploreStore.getAssociatedViews()}} />
                            <div>
                            {
                                exploreStore.details.length > 0 && <RadarChart
                                    dataSource={exploreStore.details}
                                    threshold={0.8}
                                    keyField="type"
                                    valueField="significance"
                                />
                            }
                            </div>
                        </div>
                    }
                </div>
                <div>
                    {
                        showAsso && <Ass />
                    }
                </div>
            </div>
        </div>
    </div>
}

export default observer(LTSPage);