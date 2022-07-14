import React, { useCallback } from 'react';
import { observer } from 'mobx-react-lite';
import intl from 'react-intl-universal';
import { CommandButton, DefaultButton, Spinner, Stack } from 'office-ui-fabric-react';

import { useGlobalStore } from '../../../store';
import { AssoContainer, LoadingLayer } from '../components';
import ReactVega from '../../../components/react-vega';
import { applyFilter } from '../utils';

const PattSegment: React.FC = () => {
    const { discoveryMainStore } = useGlobalStore();
    const { pattSpecList, computing, pattViews, mainVizSetting, dataSource } = discoveryMainStore;
    const loadMore = useCallback(() => {
        discoveryMainStore.increaseRenderAmount('featViews');
    }, [discoveryMainStore])
    if (pattViews.views.length === 0) return <div />
    return <div className="card">
        <h1>{intl.get('discovery.main.associate.patterns')}</h1>
        <AssoContainer>
            {
                pattSpecList.map((spec, i) => <div className="asso-segment" key={`p-${i}`}>
                    {
                        computing && <LoadingLayer>
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
                        {/* <CommandButton
                    iconProps={{ iconName: 'Compare' }}
                    text={intl.get('discovery.main.compare')}
                    onClick={() => {
                        discoveryMainStore.updateMainView(pattViews.views[i])
                        setMergeView(views[i])
                        discoveryMainStore.updateMainVizSettings(s => {
                            s.resize.mode = IResizeMode.auto
                        })
                    }}
                /> */}
                        {/* <IconButton iconProps={{ iconName: 'Pinned' }}
                    title={intl.get('discovery.main.pin')}
                    onClick={() => {
                        setPined(views[i])
                    }}
                />
                <IconButton iconProps={{ iconName: 'Compare' }}
                    title={intl.get('discovery.main.compare')}
                    onClick={() => {
                        setMergeView(views[i])
                        discoveryMainStore.updateMainVizSettings(s => {
                            s.resize.mode = IResizeMode.auto
                        })
                    }}
                /> */}
                    </Stack>
                    <div className="chart-container">
                        <ReactVega
                            actions={mainVizSetting.debug}
                            spec={spec}
                            dataSource={applyFilter(dataSource, pattViews.views[i].filters)}
                        />
                    </div>
                    {
                        pattViews.views[i].filters && <div>
                            <h4>filters</h4>
                            {pattViews.views[i].filters!.map(f => `${f.field.name || f.field.fid} = ${f.values.join(',')}`).join('\n')}
                        </div>
                    }
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
