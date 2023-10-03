import React, { useCallback, useRef } from 'react';
import { observer } from 'mobx-react-lite';
import styled from 'styled-components';
import intl from 'react-intl-universal';
import { runInAction, toJS } from 'mobx';
import { DefaultButton, PrimaryButton } from '@fluentui/react';
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
        border-bottom: 1px solid #f5f5f5;
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
            border-left: 1px solid #f5f5f5;
            overflow: auto;
        }
    }
`;

const LTSPage: React.FC = () => {
    const { ltsPipeLineStore, megaAutoStore, commonStore } = useGlobalStore();

    const { visualConfig, mainViewSpecSource } = megaAutoStore;
    const { taskMode } = commonStore;

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
                <DefaultButton
                    style={{ float: 'right' }}
                    iconProps={{ iconName: 'Settings' }}
                    text={intl.get('preference.config')}
                    ariaLabel={intl.get('preference.config')}
                    onClick={() => {
                        runInAction(() => {
                            megaAutoStore.showPreferencePannel = true;
                        });
                    }}
                />
                <PrimaryButton
                    style={{ float: 'right', marginRight: '1em' }}
                    iconProps={{ iconName: 'Rerun' }}
                    text={intl.get('megaAuto.reRun')}
                    ariaLabel={intl.get('megaAuto.reRun')}
                    onClick={startTask}
                />
                <ComputationProgress />
                <MainHeader>{intl.get('megaAuto.title')}</MainHeader>
                <p className="state-description">{intl.get('megaAuto.hintMain')}</p>
                <Divider style={{ marginBottom: '1em', marginTop: '1em' }} />
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
                                        <DefaultButton
                                            text={intl.get('megaAuto.exitEditor')}
                                            onClick={() => {
                                                megaAutoStore.setMainViewSpecSource('default');
                                            }}
                                        />
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
            </Card>
        </div>
    );
};

export default observer(LTSPage);
