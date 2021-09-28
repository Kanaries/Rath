import { observer } from 'mobx-react-lite';
import { DefaultButton, PrimaryButton, Stack, ProgressIndicator, IconButton, SpinButton, Position, CommandBarButton } from 'office-ui-fabric-react';
import React, { useCallback } from 'react';
import { useGlobalStore } from '../../store';
import BaseChart from '../../visBuilder/vegaBase';
import RadarChart from '../../components/radarChart';
import Ass from './association/index'
import intl from 'react-intl-universal'
import { runInAction } from 'mobx';
import VizPreference from '../../components/vizPreference';

const MARGIN_LEFT = { marginLeft: '1em' };
const MARGIN_TOP = { marginTop: '1em' };

const LTSPage: React.FC = props => {
    const { ltsPipeLineStore, dataSourceStore, exploreStore } = useGlobalStore();
    const { insightSpaces, computing } = ltsPipeLineStore;

    const { pageIndex, visualConfig, spec, showAsso } = exploreStore;

    const startAnalysis = useCallback(() => {
        ltsPipeLineStore.startTask().then(() => {
            exploreStore.emitViewChangeTransaction(0)
        })
    }, [])

    const goToLastView = useCallback(() => {
        exploreStore.goToLastView();
    }, [exploreStore])

    const goToNextView = useCallback(() => {
        exploreStore.goToNextView();
    }, [exploreStore])

    return <div className="content-container">
        <VizPreference />
        <div className="card">
            <CommandBarButton
                style={{ float: 'right' }}
                iconProps={{ iconName: 'Settings' }}
                text={intl.get('explore.preference')}
                ariaLabel={intl.get('explore.preference')}
                onClick={() => {
                    runInAction(() => { exploreStore.showPreferencePannel = true; })
                }}
            />
            <Stack horizontal>
                {
                    insightSpaces.length > 0 && <DefaultButton
                        text={intl.get('lts.autoAnalysis')}
                        iconProps={{ iconName: 'Financial' }}
                        disabled={dataSourceStore.cleanedData.length === 0}
                        onClick={startAnalysis}
                    />
                }
                {
                    insightSpaces.length === 0 && <PrimaryButton
                        text={intl.get('lts.autoAnalysis')}
                        iconProps={{ iconName: 'Financial' }}
                        disabled={dataSourceStore.cleanedData.length === 0}
                        onClick={startAnalysis}
                    />
                }
            </Stack>
            <Stack horizontal style={MARGIN_TOP}>
                <DefaultButton
                    disabled={insightSpaces.length === 0}
                    text="←"
                    onClick={goToLastView}
                />
                <DefaultButton
                    disabled={insightSpaces.length === 0}
                    style={MARGIN_LEFT}
                    text="→"
                    onClick={goToNextView}
                />
                <SpinButton
                    disabled={insightSpaces.length === 0}
                    style={{ marginLeft: "10px", width: '4em' }}
                    value={`${pageIndex + 1} / ${insightSpaces.length}`}
                    min={0}
                    max={insightSpaces.length}
                    step={1}
                    labelPosition={Position.start}
                    // tslint:disable:jsx-no-lambda
                    onValidate={(value: string) => { exploreStore.emitViewChangeTransaction((Number(value) - 1) % insightSpaces.length) }}
                    onIncrement={goToNextView}
                    onDecrement={goToLastView}
                    incrementButtonAriaLabel={'Increase value by 1'}
                    decrementButtonAriaLabel={'Decrease value by 1'}
                    />
            </Stack>
            <div className="h-4">
            { computing && <ProgressIndicator description={intl.get('lts.computing')} />}
            </div>
            <h1 className="state-header" style={MARGIN_TOP}>{intl.get('lts.title')}</h1>
            <p className="state-description">{intl.get('lts.hintMain')}</p>
            <div>
                <p className="state-description">results: {pageIndex + 1} / {insightSpaces.length}. score: {insightSpaces.length > 0 && insightSpaces[pageIndex].score?.toFixed(2)}</p>
                <div>
                    {insightSpaces.length > 0 && spec && <div>
                        <BaseChart
                            defaultAggregated={visualConfig.defaultAggregated}
                            defaultStack={visualConfig.defaultStack}
                            dimensions={insightSpaces[pageIndex].dimensions}
                            measures={insightSpaces[pageIndex].measures}
                            dataSource={dataSourceStore.cleanedData}
                            schema={spec.schema}
                            fieldFeatures={dataSourceStore.fieldMetas.map(f => ({
                                name: f.fid,
                                type: f.semanticType
                            }))}
                            aggregator={visualConfig.aggregator}
                        />
                    </div>}
                    {
                        insightSpaces.length > 0 && spec && <div>
                            <Stack horizontal>
                                <PrimaryButton iconProps={{ iconName: 'Lightbulb' }} text={intl.get('lts.associate')} onClick={() => {exploreStore.getAssociatedViews()}} />
                                <DefaultButton disabled style={MARGIN_LEFT} text={intl.get('lts.summary')} onClick={() => {exploreStore.scanDetails(pageIndex)}} />
                            </Stack>
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