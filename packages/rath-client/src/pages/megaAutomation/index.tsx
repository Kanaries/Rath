import React, { useCallback } from 'react';
import { observer } from 'mobx-react-lite';
import styled from 'styled-components';
import intl from 'react-intl-universal';
import { DefaultButton, PrimaryButton } from '@fluentui/react';
import { useGlobalStore } from '../../store';
import { PIVOT_KEYS } from '../../constants';
import EditorCore from '../editor/core';
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

const ActionGroup = styled.div`
    float: right;
    display: flex;
    flex-direction: row;
    align-items: center;
    > * {
        flex-grow: 0;
        flex-shrink: 0;
        :not(:last-child) {
            margin-right: 1em;
        }
    }
`;

const InsightContainer = styled.div`
    .ope-container {
        margin: 1em 0em;
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

    const { visualConfig, mainViewSpecSource, mainViewSpec, mainViewPattern } = megaAutoStore;
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
        ltsPipeLineStore.startTask(taskMode).then(() => {
            megaAutoStore.emitViewChangeTransaction(0);
        });
        commonStore.setAppKey(PIVOT_KEYS.megaAuto);
    }, [ltsPipeLineStore, megaAutoStore, commonStore, taskMode]);
    const viewExists = !(mainViewPattern === null || mainViewSpec === null);
    return (
        <div className="content-container">
            <SaveModal />
            <Constraints />
            <AssoPanel />
            {/* <SubinsightSegment data={subinsightsData} show={showSubinsights} onClose={() => { megaAutoStore.setShowSubinsights(false) }} /> */}
            <div className="card">
                <ActionGroup>
                    <PrimaryButton
                        iconProps={{ iconName: 'Rerun' }}
                        text={intl.get('megaAuto.reRun')}
                        ariaLabel={intl.get('megaAuto.reRun')}
                        onClick={startTask}
                    />
                    <VizPreference />
                </ActionGroup>
                <ComputationProgress />
                <MainHeader>{intl.get('megaAuto.title')}</MainHeader>
                <p className="state-description">{intl.get('megaAuto.hintMain')}</p>
                <VizPagination />
                <InsightContainer>
                    {viewExists && (
                        <div className="ope-container">
                            <OperationBar />
                        </div>
                    )}
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
                        <MainCanvas />
                        {visualConfig.nlg && <div className="insight-info"><Narrative /></div>}
                    </div>
                    <div>
                        <FieldContainer />
                    </div>
                </InsightContainer>
            </div>
        </div>
    );
};

export default observer(LTSPage);
