import React, { useCallback } from 'react';
import { observer } from 'mobx-react-lite';
import intl from 'react-intl-universal';
import { CommandButton, DefaultButton, Spinner, Stack } from 'office-ui-fabric-react';

import { useGlobalStore } from '../../../store';
import { AssoContainer, LoadingLayer } from '../components';
import ReactVega from '../../../components/react-vega';
import { applyFilter } from '../utils';

const FilterSegment: React.FC = () => {
    const { discoveryMainStore } = useGlobalStore();
    const { filterSpecList, computing, filterViews, mainVizSetting, dataSource } = discoveryMainStore;
    const loadMore = useCallback(() => {
        discoveryMainStore.increaseRenderAmount('featViews');
    }, [discoveryMainStore])
    if (filterViews.views.length === 0) return <div />
    return <div className="card">
        <h1>{intl.get('discovery.main.associate.filters')}</h1>
        <AssoContainer>
            {
             filterSpecList.map((spec, i) => <div className="asso-segment" key={`p-${i}`}>
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
                                discoveryMainStore.updateMainView(filterViews.views[i])
                            }}
                        />
                        <CommandButton
                            iconProps={{ iconName: 'Compare' }}
                            text={intl.get('discovery.main.compare')}
                            onClick={() => {
                                discoveryMainStore.updateCompareView(filterViews.views[i])
                            }}
                        />
                    </Stack>
                    <div className="chart-container">
                        <ReactVega
                            actions={mainVizSetting.debug}
                            spec={spec}
                            dataSource={applyFilter(dataSource, filterViews.views[i].filters)}
                        />
                    </div>
                    {
                        filterViews.views[i].filters && <div>
                            <h4>filters</h4>
                            {filterViews.views[i].filters!.map(f => `${f.field.name || f.field.fid} = ${f.values.join(',')}`).join('\n')}
                        </div>
                    }
                </div>)
            }
        </AssoContainer>
        <DefaultButton disabled={filterViews.amount >= filterViews.views.length}
            style={{ marginTop: '8px' }}
            text={intl.get('discovery.main.loadMore')}
            onClick={loadMore}
        />
    </div>
}

export default observer(FilterSegment);
