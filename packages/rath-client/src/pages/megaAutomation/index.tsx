import React from 'react';
import { observer } from 'mobx-react-lite';
import { Divider, Pagination } from '@material-ui/core';
import styled from 'styled-components';
import intl from 'react-intl-universal';
import { runInAction } from 'mobx';
import { CommandBarButton, Spinner } from '@fluentui/react';

import { useGlobalStore } from '../../store';
import VisErrorBoundary from '../../visBuilder/visErrorBoundary';
import VizPreference from './preference';
import SaveModal from './save';
import OperationBar from './vizOperation/operationBar';
import FieldContainer from './vizOperation/fieldContainer';
import { IResizeMode } from '../../interfaces';
import ResizeContainer from './resizeContainer';
import Narrative from './narrative';
import { LoadingLayer } from '../semiAutomation/components';
import ComputationProgress from './computationProgress';
import ReactVega from '../../components/react-vega';
import Constraints from './vizOperation/constraints';
import AssoPanel from './assoPanel';

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
    const { ltsPipeLineStore, megaAutoStore } = useGlobalStore();
    const { computing, rendering, dataSource } = ltsPipeLineStore;

    const { pageIndex, visualConfig, insightSpaces, mainViewSpec } = megaAutoStore;

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

    return (
        <div className="content-container">
            <VizPreference />
            <SaveModal />
            <Constraints />
            <AssoPanel />
            {/* <SubinsightSegment data={subinsightsData} show={showSubinsights} onClose={() => { megaAutoStore.setShowSubinsights(false) }} /> */}
            <div className="card">
                <CommandBarButton
                    style={{ float: 'right' }}
                    iconProps={{ iconName: 'Settings' }}
                    text={intl.get('explore.preference')}
                    ariaLabel={intl.get('explore.preference')}
                    onClick={() => {
                        runInAction(() => {
                            megaAutoStore.showPreferencePannel = true;
                        });
                    }}
                />
                <ComputationProgress computing={computing} />
                <MainHeader>{intl.get('lts.title')}</MainHeader>
                <p className="state-description">{intl.get('lts.hintMain')}</p>
                <Pagination
                    style={{ marginTop: '1em', marginLeft: '1em' }}
                    variant="outlined"
                    shape="rounded"
                    count={insightSpaces.length}
                    page={pageIndex + 1}
                    onChange={(e, v) => {
                        megaAutoStore.emitViewChangeTransaction((v - 1) % insightSpaces.length);
                    }}
                />
                <Divider style={{ marginBottom: '1em', marginTop: '1em' }} />
                <InsightContainer>
                    <div className="ope-container">
                        <OperationBar />
                    </div>
                    <div className="flex-container">
                        {/* <div className='spec-container'>
                        {
                            spec && <VizSpec
                                schema={spec.schema}
                                fields={fieldMetas}
                                onSchemaChange={(schemaKey, pos, val) => {
                                    megaAutoStore.setSpecSchema(schemaKey, pos, val);
                                }}
                            />
                        }
                    </div> */}
                        <div className="insight-viz">
                            {rendering && (
                                <LoadingLayer>
                                    <Spinner label="Rendering..." />
                                </LoadingLayer>
                            )}
                            {insightSpaces.length > 0 && mainViewSpec && (
                                <ResizeContainer
                                    enableResize={
                                        visualConfig.resize === IResizeMode.control &&
                                        !(mainViewSpec.encoding.column || mainViewSpec.encoding.row)
                                    }
                                >
                                    <VisErrorBoundary>
                                        <ReactVega
                                            dataSource={dataSource}
                                            spec={mainViewSpec}
                                            actions={visualConfig.debug}
                                        />
                                    </VisErrorBoundary>
                                </ResizeContainer>
                            )}
                        </div>
                        <div className="insight-info">{visualConfig.nlg && <Narrative />}</div>
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
