import { makeAutoObservable, observable, runInAction } from 'mobx';
import { observer } from 'mobx-react-lite';
import { DefaultButton, PrimaryButton, Toggle, Stack } from 'office-ui-fabric-react';
import React, { useEffect, useState } from 'react';
import { useRef } from 'react';
import { ISpec } from 'visual-insights/build/esm/insights/InsightFlow/specification/encoding';
import { IRow } from '../../interfaces';
import { useGlobalStore } from '../../store';
import { LTSPipeLine } from '../../store/pipeLineStore/lts';
import BaseChart from '../../visBuilder/vegaBase';

class PageTMPStore {
    public pageIndex: number = 0;
    public aggState: boolean = false;
    private ltsPipeLineStore: LTSPipeLine;
    public spec: { schema: ISpec; dataView: IRow[] } | undefined = undefined;
    constructor (ltsPipeLineStore: LTSPipeLine) {
        makeAutoObservable(this, {
            spec: observable.ref
        });
        this.ltsPipeLineStore = ltsPipeLineStore;
    }
    public async emitViewChangeTransaction(index: number) {
        // pipleLineStore统一提供校验逻辑
        if (this.ltsPipeLineStore.insightSpaces && this.ltsPipeLineStore.insightSpaces.length > index) {
            const spec = this.ltsPipeLineStore.specify(index);
            if (spec) {
                // this.spec = spec;
                const agg = !spec.schema.geomType?.includes('point');
                runInAction(() => {
                    this.spec = spec;
                    this.aggState = agg;
                    this.pageIndex = index;
                })
            }
        }
    }
    public setAggState (aggState: boolean) {
        this.aggState = aggState;
    }
}

function useTMPStore (ltsPipeLineStore: LTSPipeLine) {
    const storeRef = useRef<PageTMPStore>(new PageTMPStore(ltsPipeLineStore));
    return storeRef.current;
}

const LTSPage: React.FC = props => {
    const { ltsPipeLineStore, dataSourceStore } = useGlobalStore();
    const { insightSpaces } = ltsPipeLineStore;
    const tmpStore = useTMPStore(ltsPipeLineStore);

    if (tmpStore === null) return null;

    const { pageIndex, aggState, spec } = tmpStore;


    return <div className="content-container">
        <div className="card">
            <Stack horizontal>
                <PrimaryButton
                    text="Analysis"
                    disabled={dataSourceStore.cleanedData.length === 0}
                    onClick={() => {
                        ltsPipeLineStore.startTask().then(() => {
                            tmpStore.emitViewChangeTransaction(0)
                        })
                    }}
                />
                <DefaultButton
                    style={{ marginLeft: "10px" }}
                    text="←"
                    onClick={() => {
                        tmpStore.emitViewChangeTransaction((pageIndex - 1 + insightSpaces.length) % insightSpaces.length)
                    }}
                />
                <DefaultButton
                    style={{ marginLeft: "10px" }}
                    text="→"
                    onClick={() => {
                        tmpStore.emitViewChangeTransaction((pageIndex + 1) % insightSpaces.length)
                    }}
                />
            </Stack>
            <Toggle
                checked={aggState}
                onText="On"
                offText="Off"
                label="Default Aggregate"
                onChange={(e, checked) => {
                    tmpStore.setAggState(Boolean(checked))
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
                </div>
            </div>
        </div>
    </div>
}

export default observer(LTSPage);