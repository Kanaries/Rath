import React, { useCallback } from 'react';
import { observer } from 'mobx-react-lite';
import intl from 'react-intl-universal';
import { CommandButton, DefaultButton, Spinner, Stack } from '@fluentui/react';

import { useGlobalStore } from '../../../store';
import { AssoContainer, LoadingLayer } from '../components';
import ReactVega from '../../../components/react-vega';
import { applyFilter } from '../utils';

const PattSegment: React.FC = () => {
    const { discoveryMainStore } = useGlobalStore();
    const { pattSpecList, pattViews, mainVizSetting, dataSource, autoAsso, hasMainView } = discoveryMainStore;
    const loadMore = useCallback(() => {
        discoveryMainStore.increaseRenderAmount('pattViews');
    }, [discoveryMainStore])
    const assViews = useCallback(() => {
        discoveryMainStore.pattAssociate();
    }, [discoveryMainStore])
    if (pattViews.views.length === 0 && autoAsso.pattViews) return <div />
    return <div className="pure-card">
        <h1 className="ms-fontSize-18">{intl.get('discovery.main.associate.patterns')}</h1>
        {
            !autoAsso.pattViews && <DefaultButton
                disabled={!hasMainView}
                iconProps={{ iconName: 'ScatterChart' }}
                text={intl.get('discovery.main.relatePatterns')} onClick={assViews}
            />
        }
        <AssoContainer>
            {
                pattSpecList.map((spec, i) => <div className="asso-segment" key={`p-${i}`}>
                    {
                        pattViews.computing && <LoadingLayer>
                            <Spinner label="loading" />
                        </LoadingLayer>
                    }
                    <Stack horizontal>
                        <CommandButton
                            iconProps={{ iconName: 'Pinned' }}
                            text={intl.get('discovery.main.pin')}
                            onClick={() => {
                                discoveryMainStore.updateMainView(pattViews.views[i])
                            }}
                        />
                    </Stack>
                    <div className="chart-container">
                        <ReactVega
                            actions={mainVizSetting.debug}
                            spec={spec}
                            dataSource={applyFilter(dataSource, pattViews.views[i].filters)}
                        />
                    </div>
                    <div className="chart-desc">
                        { pattViews.views[i].fields?.filter(f => f.analyticType === 'dimension').map(f => f.name || f.fid).join(', ') } <br />
                        { pattViews.views[i].fields?.filter(f => f.analyticType === 'measure').map(f => f.name || f.fid).join(', ') } <br />
                        { pattViews.views[i].filters?.map(f => `${f.field.name || f.field.fid} = ${f.values.join(', ')}`).join('\n') }
                    </div>
                </div>)
            }
        </AssoContainer>
        <DefaultButton disabled={pattViews.amount >= pattViews.views.length}
            style={{ marginTop: '8px' }}
            text={intl.get('discovery.main.loadMore')}
            onClick={loadMore}
        />
    </div>
}

export default observer(PattSegment);
