import React, { useCallback, useState } from 'react';
import { observer } from 'mobx-react-lite';
import { Divider, Pagination } from '@material-ui/core';
import styled from 'styled-components';
import intl from 'react-intl-universal'
import { runInAction, toJS } from 'mobx';
import { DefaultButton, PrimaryButton, Stack, ProgressIndicator, CommandBarButton, IconButton, Toggle } from 'office-ui-fabric-react';

import { useGlobalStore } from '../../store';
import BaseChart from '../../visBuilder/vegaBase';
import VisErrorBoundary from '../../visBuilder/visErrorBoundary';
import VizPreference from '../../components/vizPreference';
import VizOperation from './vizOperation';
import SaveModal from './save';
import CommonVisSegment from './commonVisSegment';
import SubinsightSegment from './subinsights';

const MARGIN_LEFT = { marginLeft: '1em' };

const MainHeader = styled.div`
    font-size: 1.5em;
    font-weight: 500;
`

const InsightContainer = styled.div`
    display: flex;
    .insight-viz{
        flex-grow: 1;
        flex-shrink: 2;
        overflow: auto;
    }
    .insight-info{
        flex-grow: 2;
        flex-shrink: 1;
        flex-basis: 500px;
        padding: 0em 1em;
        border-left: 1px solid #f5f5f5;
    }
`

const LTSPage: React.FC = props => {
    const { ltsPipeLineStore, exploreStore, commonStore } = useGlobalStore();
    const { insightSpaces, computing } = ltsPipeLineStore;

    const { pageIndex, visualConfig, spec, showSubinsights } = exploreStore;
    const [showCommonVis, setShowCommonVis] = useState<boolean>(true);
    const [subinsightsData, setSubinsightsData] = useState<any[]>([]);

    const startAnalysis = useCallback(() => {
        ltsPipeLineStore.startTask().then(() => {
            exploreStore.emitViewChangeTransaction(0)
        }).catch(err => {
            commonStore.showError('error', err)
        })
    }, [ltsPipeLineStore, exploreStore, commonStore])

    const downloadResults = useCallback(() => {
        exploreStore.downloadResults();
    }, [exploreStore])

    const dataIsEmpty = ltsPipeLineStore.dataSource.length === 0;

    const getSubinsights = useCallback((dimensions: string[], measures: string[]) => {
        exploreStore.getSubInsights(dimensions, measures).then(res => {
            setSubinsightsData(res)
            exploreStore.setShowSubinsights(true)
        })
    }, [exploreStore])

    return <div className="content-container">
        <VizPreference />
        <SaveModal />
        <SubinsightSegment data={subinsightsData} show={showSubinsights} onClose={() => { exploreStore.setShowSubinsights(false) }} />
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
                        disabled={dataIsEmpty}
                        onClick={startAnalysis}
                    />
                }
                {
                    insightSpaces.length === 0 && <PrimaryButton
                        text={intl.get('lts.autoAnalysis')}
                        iconProps={{ iconName: 'Financial' }}
                        disabled={dataIsEmpty}
                        onClick={startAnalysis}
                    />
                }
                <DefaultButton
                    style={MARGIN_LEFT}
                    text={intl.get('function.save.title')}
                    iconProps={{ iconName: 'clouddownload' }}
                    disabled={dataIsEmpty}
                    onClick={() => {
                        exploreStore.setShowSaveModal(true);
                    }}
                />
                <IconButton
                    style={MARGIN_LEFT}
                    text={intl.get('function.exportStorage.title')}
                    iconProps={{ iconName: 'DownloadDocument' }}
                    disabled={dataIsEmpty}
                    onClick={downloadResults}
                />
            </Stack>
            <div className="h-4">
            { computing && <ProgressIndicator description={intl.get('lts.computing')} />}
            </div>
            <MainHeader>{intl.get('lts.title')}</MainHeader>
            <p className="state-description">{intl.get('lts.hintMain')}</p>
            {/* <Divider style={{ marginBottom: '1em', marginTop: '1em' }} /> */}
            <Pagination style={{ marginBottom: '1em', marginTop: '1em' }} variant="outlined" shape="rounded" count={insightSpaces.length} page={pageIndex + 1} onChange={(e, v) => {
                exploreStore.emitViewChangeTransaction((v - 1) % insightSpaces.length);
            }} />
            <Divider style={{ marginBottom: '1em', marginTop: '1em' }} />
            <InsightContainer>
                <div className="insight-viz">
                {insightSpaces.length > 0 && spec && <div>
                            <VisErrorBoundary>
                                <BaseChart
                                    defaultAggregated={visualConfig.defaultAggregated}
                                    defaultStack={visualConfig.defaultStack}
                                    dimensions={insightSpaces[pageIndex].dimensions}
                                    measures={insightSpaces[pageIndex].measures}
                                    dataSource={visualConfig.defaultAggregated ? spec.dataView : ltsPipeLineStore.dataSource}
                                    schema={spec.schema}
                                    fieldFeatures={ltsPipeLineStore.fields.map(f =>({
                                        name: f.key,
                                        type: f.semanticType
                                    }))}
                                    aggregator={visualConfig.aggregator}
                                    viewSize={320}
                                    stepSize={32}
                                />
                            </VisErrorBoundary>
                        </div>}
                </div>
                <div className="insight-info">
                    <VizOperation />
                </div>
            </InsightContainer>
            <div>
                <Stack horizontal>
                    <Toggle checked={showCommonVis}
                        onText={intl.get('lts.commonVis.text')}
                        offText={intl.get('lts.commonVis.text')}
                        onChange={(e, checked) => {
                        setShowCommonVis(Boolean(checked))
                    }} />
                    <DefaultButton
                        text={intl.get('lts.subinsights')}
                        style={MARGIN_LEFT}
                        onClick={() => {
                            getSubinsights(
                                toJS(insightSpaces[pageIndex].dimensions),
                                toJS(insightSpaces[pageIndex].measures))
                        }}
                    />
                </Stack>
                {
                    insightSpaces.length > 0 && showCommonVis && spec && <CommonVisSegment
                        defaultAggregated={true}
                        defaultStack={visualConfig.defaultStack}
                        dimensions={insightSpaces[pageIndex].dimensions}
                        measures={insightSpaces[pageIndex].measures}
                        dataSource={visualConfig.defaultAggregated ? spec.dataView : ltsPipeLineStore.dataSource}
                        schema={spec.schema}
                        fieldFeatures={ltsPipeLineStore.fields.map(f =>({
                            name: f.key,
                            type: f.semanticType
                        }))}
                        aggregator={visualConfig.aggregator}
                    />
                }
            </div>
        </div>
    </div>
}

export default observer(LTSPage);