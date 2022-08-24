import React, { useCallback, useState } from 'react';
import { observer } from 'mobx-react-lite';
import { Divider, Pagination } from '@material-ui/core';
import styled from 'styled-components';
import intl from 'react-intl-universal'
import { runInAction } from 'mobx';
import { DefaultButton, Stack, CommandBarButton, IconButton, Toggle, Dropdown, IDropdownOption, Spinner } from 'office-ui-fabric-react';

import { useGlobalStore } from '../../store';
import BaseChart from '../../visBuilder/vegaBase';
import VisErrorBoundary from '../../visBuilder/visErrorBoundary';
import VizPreference from '../../components/vizPreference';
import VizOperation from './vizOperation';
import SaveModal from './save';
import CommonVisSegment from './commonVisSegment';
import { EXPLORE_VIEW_ORDER } from '../../store/exploreStore';
import OperationBar from './vizOperation/operationBar';
import FieldContainer from './vizOperation/fieldContainer';
import { IResizeMode } from '../../interfaces';
import ResizeContainer from './resizeContainer';
import Narrative from './narrative';
import { LoadingLayer } from '../semiAutomation/components';
import ComputationProgress from './computationProgress';

const MARGIN_LEFT = { marginLeft: '1em' };

const MainHeader = styled.div`
    font-size: 1.5em;
    font-weight: 500;
`

const InsightContainer = styled.div`
    .ope-container{
        margin: 1em 0em;
        padding-bottom: 1em;
        border-bottom: 1px solid #f5f5f5;
    }
    .flex-container{
        display: flex;
        overflow-x: auto;
        .insight-viz{
            position: relative;
            padding: 2em;
            flex-grow: 0;
            flex-shrink: 0;
            /* flex-basis: 400px; */
            /* min-width: 500px; */
            /* flex-shrink: 2; */
            overflow: auto;
        }
        .insight-info{
            flex-grow: 1;
            flex-shrink: 1;
            flex-wrap: wrap;
            padding: 0em 1em;
            border-left: 1px solid #f5f5f5;
            overflow: auto;
        }
    }
`

const LTSPage: React.FC = () => {
    const { ltsPipeLineStore, exploreStore } = useGlobalStore();
    const { computing, fieldMetas, rendering } = ltsPipeLineStore;

    const {
        pageIndex,
        visualConfig,
        spec,
        // showSubinsights,
        insightSpaces
    } = exploreStore;
    const [showCommonVis, setShowCommonVis] = useState<boolean>(true);
    // const [subinsightsData, setSubinsightsData] = useState<any[]>([]);


    const downloadResults = useCallback(() => {
        exploreStore.downloadResults();
    }, [exploreStore])

    const dataIsEmpty = ltsPipeLineStore.dataSource.length === 0;

    // const getSubinsights = useCallback((dimensions: string[], measures: string[]) => {
    //     exploreStore.getSubInsights(dimensions, measures).then(res => {
    //         setSubinsightsData(res)
    //         exploreStore.setShowSubinsights(true)
    //     })
    // }, [exploreStore])

    const orderOptions: IDropdownOption[] = Object.values(EXPLORE_VIEW_ORDER).map(or => ({
        text: intl.get(`lts.orderBy.${or}`),
        key: or
    }))
    return <div className="content-container">
        <VizPreference />
        <SaveModal />
        {/* <SubinsightSegment data={subinsightsData} show={showSubinsights} onClose={() => { exploreStore.setShowSubinsights(false) }} /> */}
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
                <DefaultButton
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
            <ComputationProgress computing={computing} />
            <MainHeader>{intl.get('lts.title')}</MainHeader>
            <p className="state-description">{intl.get('lts.hintMain')}</p>
            <Stack style={{ marginRight: '1em' }} horizontal>
                <Stack.Item align="end">
                    <Dropdown style={{ minWidth: '120px' }}
                        selectedKey={exploreStore.orderBy}
                        options={orderOptions}
                        label={intl.get('lts.orderBy.title')}
                        onChange={(e, item) => {
                        item && exploreStore.setExploreOrder(item.key as string);
                        }}
                    />
                </Stack.Item>
                <Stack.Item align="end">
                    <Pagination style={{ marginTop: '1em', marginLeft: '1em' }}
                        variant="outlined"
                        shape="rounded"
                        count={insightSpaces.length}
                        page={pageIndex + 1}
                        onChange={(e, v) => {
                            exploreStore.emitViewChangeTransaction((v - 1) % insightSpaces.length);
                        }}
                    />
                </Stack.Item>
                
            </Stack>
            <Divider style={{ marginBottom: '1em', marginTop: '1em' }} />
            <InsightContainer>
                <div className="ope-container">
                    <OperationBar />
                </div>
                <div className="flex-container">
                    <div className="insight-viz">
                        {
                            rendering && <LoadingLayer>
                                <Spinner label='Rendering...' />
                            </LoadingLayer>
                        }
                    {insightSpaces.length > 0 && spec && <ResizeContainer enableResize={visualConfig.resize === IResizeMode.control && !(spec.schema.facets)}>
                            <VisErrorBoundary>
                                <BaseChart
                                    defaultAggregated={visualConfig.defaultAggregated}
                                    defaultStack={visualConfig.defaultStack}
                                    dimensions={insightSpaces[pageIndex].dimensions}
                                    measures={insightSpaces[pageIndex].measures}
                                    dataSource={visualConfig.defaultAggregated ? spec.dataView : ltsPipeLineStore.dataSource}
                                    schema={spec.schema}
                                    fieldFeatures={fieldMetas}
                                    aggregator={visualConfig.aggregator}
                                    viewSize={visualConfig.resize === IResizeMode.auto ? 320 : visualConfig.resizeConfig.width}
                                    stepSize={32}
                                    zoom={visualConfig.zoom}
                                    debug={visualConfig.debug}
                                    sizeMode={visualConfig.resize}
                                    width={visualConfig.resizeConfig.width}
                                    height={visualConfig.resizeConfig.height}
                                />
                            </VisErrorBoundary>
                        </ResizeContainer>}
                        {/*  {
                            insightSpaces.length > 0 && <ReactVega spec={labDistVis({
                                pattern: { imp: 0, fields: [...insightSpaces[pageIndex].dimensions, ...insightSpaces[pageIndex].measures].map(f => fieldMetas.find(m => m.fid === f)).filter(a => Boolean(a)) as IFieldMeta[] },
                                dataSource: ltsPipeLineStore.dataSource
                            })} dataSource={ltsPipeLineStore.dataSource}  />
                        } */}
                    </div>
                    <div className="insight-info">
                        <VizOperation />
                        { visualConfig.nlg && <Narrative /> }
                    </div>
                </div>
                <div>
                    <FieldContainer />
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
                    {/* <DefaultButton
                        text={intl.get('lts.subinsights')}
                        style={MARGIN_LEFT}
                        onClick={() => {
                            getSubinsights(
                                toJS(insightSpaces[pageIndex].dimensions),
                                toJS(insightSpaces[pageIndex].measures))
                        }}
                    /> */}
                </Stack>
                {
                    insightSpaces.length > 0 && showCommonVis && spec && <CommonVisSegment
                        defaultAggregated={true}
                        defaultStack={visualConfig.defaultStack}
                        dimensions={insightSpaces[pageIndex].dimensions}
                        measures={insightSpaces[pageIndex].measures}
                        dataSource={visualConfig.defaultAggregated ? spec.dataView : ltsPipeLineStore.dataSource}
                        schema={spec.schema}
                        fieldFeatures={fieldMetas}
                        aggregator={visualConfig.aggregator}
                    />
                }
            </div>
        </div>
    </div>
}

export default observer(LTSPage);