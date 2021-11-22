import { observer } from 'mobx-react-lite';
import { DefaultButton, PrimaryButton, Stack, ProgressIndicator, CommandBarButton } from 'office-ui-fabric-react';
import React, { useCallback } from 'react';
import { useGlobalStore } from '../../store';
import BaseChart from '../../visBuilder/vegaBase';
import RadarChart from '../../components/radarChart';
import Ass from './association/index'
import intl from 'react-intl-universal'
import { runInAction } from 'mobx';
import VizPreference from '../../components/vizPreference';
import { Divider, Pagination } from '@material-ui/core';
import styled from 'styled-components';
import { PIVOT_KEYS } from '../../constants';

const MARGIN_LEFT = { marginLeft: '1em' };

const MainHeader = styled.div`
    font-size: 1.5em;
    font-weight: 500;
`

const LTSPage: React.FC = props => {
    const { ltsPipeLineStore, exploreStore, commonStore } = useGlobalStore();
    const { insightSpaces, computing } = ltsPipeLineStore;

    const { pageIndex, visualConfig, spec, showAsso } = exploreStore;

    const startAnalysis = useCallback(() => {
        ltsPipeLineStore.startTask().then(() => {
            exploreStore.emitViewChangeTransaction(0)
        })
    }, [ltsPipeLineStore, exploreStore])

    const customizeAnalysis = useCallback(() => {
        exploreStore.bringToGrphicWalker();
        commonStore.setAppKey(PIVOT_KEYS.editor)
    }, [exploreStore, commonStore])

    const downloadResults = useCallback(() => {
        exploreStore.downloadResults();
    }, [exploreStore])

    const dataIsEmpty = ltsPipeLineStore.dataSource.length === 0;

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
                {
                    insightSpaces.length > 0 && <DefaultButton
                        style={MARGIN_LEFT}
                        text={intl.get('function.exportStorage.title')}
                        iconProps={{ iconName: 'DownloadDocument' }}
                        disabled={dataIsEmpty}
                        onClick={downloadResults}
                    />
                }
            </Stack>
            <div className="h-4">
            { computing && <ProgressIndicator description={intl.get('lts.computing')} />}
            </div>
            <MainHeader>{intl.get('lts.title')}</MainHeader>
            <p className="state-description">{intl.get('lts.hintMain')}</p>
            <Divider style={{ marginBottom: '1em', marginTop: '1em' }} />
            <Pagination style={{ marginBottom: '1em', marginTop: '1em' }} variant="outlined" shape="rounded" count={insightSpaces.length} page={pageIndex + 1} onChange={(e, v) => {
                exploreStore.emitViewChangeTransaction((v - 1) % insightSpaces.length);
            }} />
            <div>
                <p className="state-description">results: {pageIndex + 1} / {insightSpaces.length}. score: {insightSpaces.length > 0 && insightSpaces[pageIndex].score?.toFixed(6)}</p>
                <div>
                    {insightSpaces.length > 0 && spec && <div>
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
                        />
                    </div>}
                    {
                        insightSpaces.length > 0 && spec && <div>
                            <Stack horizontal>
                                <PrimaryButton iconProps={{ iconName: 'Lightbulb' }} text={intl.get('lts.associate')} onClick={() => {exploreStore.getAssociatedViews()}} />
                                <DefaultButton disabled style={MARGIN_LEFT} text={intl.get('lts.summary')} onClick={() => {exploreStore.scanDetails(pageIndex)}} />
                                <DefaultButton style={MARGIN_LEFT} text={intl.get('lts.bring')} onClick={customizeAnalysis} />
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