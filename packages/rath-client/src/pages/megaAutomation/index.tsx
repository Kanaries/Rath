import React, { useCallback, useRef } from 'react';
import { observer } from 'mobx-react-lite';
import styled from 'styled-components';
import intl from 'react-intl-universal';
import { runInAction, toJS } from 'mobx';
import { Button } from '../../components/ui/button';
import { RathIcon } from '../../components/icons';
import { useGlobalStore } from '../../store';
import { PIVOT_KEYS } from '../../constants';
import EditorCore from '../editor/core';
import type { IReactVegaHandler } from '../../components/react-vega';
import { Card } from '../../components/card';
import Divider from '../../components/divider';
import VizPreference from './preference';
import SaveModal from './save';
import OperationBar from './vizOperation/operationBar';
import FieldContainer from './vizOperation/fieldContainer';
import Narrative from './narrative';
import ComputationProgress from './computationProgress';
import Constraints from './vizOperation/constraints';
import AssoPanel from './assoPanel';
import VizPagination from './vizPagination';
import MainCanvas from './mainCanvas';

const MainHeader = styled.div`
    font-size: 1.5em;
    font-weight: 500;
`;

const InsightContainer = styled.div`
    .ope-container {
        margin: 1em 0em;
        padding-bottom: 1em;
        border-bottom: 1px solid var(--muted);
    }
    .flex-container {
        display: flex;
        overflow-x: auto;
        .spec-container {
            flex-grow: 0;
            flex-shrink: 0;
            overflow-y: auto;
        }
        .insight-viz {
            position: relative;
            padding: 2em;
            flex-grow: 0;
            flex-shrink: 0;
            /* flex-basis: 400px; */
            /* min-width: 500px; */
            /* flex-shrink: 2; */
            overflow: auto;
        }
        .insight-info {
            flex-grow: 1;
            flex-shrink: 1;
            flex-wrap: wrap;
            padding: 0em 1em;
            border-left: 1px solid var(--muted);
            overflow: auto;
        }
    }
`;

const LTSPage: React.FC = () => {
    const { ltsPipeLineStore, megaAutoStore, commonStore } = useGlobalStore();

    const { visualConfig, mainViewSpecSource } = megaAutoStore;
    const { taskMode } = commonStore;
    const { computing } = ltsPipeLineStore;
    const hasInsights = megaAutoStore.insightSpaces.length > 0;

    // const [subinsightsData, setSubinsightsData] = useState<any[]>([]);

    // const downloadResults = useCallback(() => {
    //     megaAutoStore.downloadResults();
    // }, [megaAutoStore])

    // const dataIsEmpty = ltsPipeLineStore.dataSource.length === 0;

    // const getSubinsights = useCallback((dimensions: string[], measures: string[]) => {
    //     megaAutoStore.getSubInsights(dimensions, measures).then(res => {
    //         setSubinsightsData(res)
    //         megaAutoStore.setShowSubinsights(true)
    //     })
    // }, [megaAutoStore])
    const startTask = useCallback(() => {
        ltsPipeLineStore.startTask(taskMode, toJS(megaAutoStore.visualConfig.viewSizeLimit)).then(() => {
            megaAutoStore.emitViewChangeTransaction(0);
        });
        commonStore.setAppKey(PIVOT_KEYS.megaAuto);
    }, [ltsPipeLineStore, megaAutoStore, commonStore, taskMode]);

    const handler = useRef<IReactVegaHandler>(null);

    return (
        <div className="content-container">
            <VizPreference />
            <SaveModal />
            <Constraints />
            <AssoPanel />
            {/* <SubinsightSegment data={subinsightsData} show={showSubinsights} onClose={() => { megaAutoStore.setShowSubinsights(false) }} /> */}
            <Card>
                <Button
                    variant="outline"
                    className="gap-1.5"
                    style={{ float: 'right' }}
                    aria-label={intl.get('preference.config')}
                    onClick={() => {
                        runInAction(() => {
                            megaAutoStore.showPreferencePannel = true;
                        });
                    }}
                >
                    <RathIcon name="Settings" />
                    {intl.get('preference.config')}
                </Button>
                <Button
                    className="gap-1.5"
                    style={{ float: 'right', marginRight: '1em' }}
                    aria-label={intl.get(hasInsights ? 'megaAuto.reRun' : 'megaAuto.autoAnalysis')}
                    disabled={computing}
                    onClick={startTask}
                >
                    <RathIcon name="Rerun" />
                    {intl.get(hasInsights ? 'megaAuto.reRun' : 'megaAuto.autoAnalysis')}
                </Button>
                <ComputationProgress />
                <MainHeader>{intl.get('megaAuto.title')}</MainHeader>
                <p className="state-description">{intl.get('megaAuto.hintMain')}</p>
                <Divider style={{ marginBottom: '1em', marginTop: '1em' }} />
                {hasInsights ? (
                    <>
                        <VizPagination />
                        <Divider style={{ marginBottom: '1em', marginTop: '1em' }} />
                        <InsightContainer>
                            <div className="ope-container">
                                <OperationBar handler={handler} />
                            </div>
                            <div className="flex-container">
                                <div className="spec-container">
                                    {mainViewSpecSource === 'custom' && (
                                        <EditorCore
                                            actionButtons={
                                                <Button
                                                    variant="outline"
                                                    onClick={() => {
                                                        megaAutoStore.setMainViewSpecSource('default');
                                                    }}
                                                >
                                                    {intl.get('megaAuto.exitEditor')}
                                                </Button>
                                            }
                                        />
                                    )}
                                </div>
                                <MainCanvas handler={handler} />
                                <div className="insight-info">{visualConfig.nlg && <Narrative />}</div>
                            </div>
                            <div>
                                <FieldContainer />
                            </div>
                        </InsightContainer>
                    </>
                ) : (
                    <div role="status" className="rounded-lg border border-dashed bg-muted/20 px-6 py-12 text-center">
                        <RathIcon name="Lightbulb" size={28} className="mx-auto mb-3 text-muted-foreground" />
                        <h2 className="text-sm font-medium">{intl.get(computing ? 'megaAuto.computing' : 'megaAuto.emptyTitle')}</h2>
                        {!computing && (
                            <>
                                <p className="mt-1 text-sm text-muted-foreground">{intl.get('megaAuto.emptyDescription')}</p>
                                <Button className="mt-4 gap-1.5" onClick={startTask}>
                                    <RathIcon name="Rerun" />
                                    {intl.get('megaAuto.autoAnalysis')}
                                </Button>
                            </>
                        )}
                    </div>
                )}
            </Card>
        </div>
    );
};

export default observer(LTSPage);
