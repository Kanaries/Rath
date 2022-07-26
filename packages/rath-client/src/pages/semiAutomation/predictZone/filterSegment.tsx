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
    const { filterSpecList, computing, filterViews, mainVizSetting, dataSource, autoAsso, mainView } = discoveryMainStore;
    const loadMore = useCallback(() => {
        discoveryMainStore.increaseRenderAmount('filterViews');
    }, [discoveryMainStore])
    const recommandFilter = useCallback(() => {
        discoveryMainStore.filterAssociate();
    }, [discoveryMainStore])
    if (filterViews.views.length === 0 && autoAsso.filterViews) return <div />
    return <div className="pure-card">
        <h1 className="ms-fontSize-18">{intl.get('discovery.main.associate.filters')}</h1>
        {
            !autoAsso.filterViews && <DefaultButton text={intl.get('discovery.main.pointInterests')}
                iconProps={{ iconName: 'SplitObject' }}
                disabled={mainView === null}
                onClick={recommandFilter}
            />
        }
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
                    <div className="chart-desc">
                        { filterViews.views[i].fields?.filter(f => f.analyticType === 'dimension').map(f => f.name || f.fid).join(', ') } <br />
                        { filterViews.views[i].fields?.filter(f => f.analyticType === 'measure').map(f => f.name || f.fid).join(', ') } <br />
                        { filterViews.views[i].filters?.map(f => `${f.field.name || f.field.fid} = ${f.values.join(',')}`).join('\n') }
                    </div>
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
