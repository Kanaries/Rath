import React, { useCallback } from 'react';
import { observer } from 'mobx-react-lite';
import intl from 'react-intl-universal';
import { CommandButton, DefaultButton, Spinner, Stack } from 'office-ui-fabric-react';

import { useGlobalStore } from '../../../store';
import { AssoContainer, LoadingLayer } from '../components';
import ReactVega from '../../../components/react-vega';
import { applyFilter } from '../utils';

const FeatSegment: React.FC = () => {
    const { discoveryMainStore } = useGlobalStore();
    const { featSpecList, computing, featViews, mainVizSetting, dataSource } = discoveryMainStore;
    const loadMore = useCallback(() => {
        discoveryMainStore.increaseRenderAmount('featViews');
    }, [discoveryMainStore])
    if (featViews.views.length === 0) return <div />
    return <div className="card">
        <h1>{intl.get('discovery.main.associate.features')}</h1>
        <AssoContainer>
            {
                featSpecList.map((spec, i) => <div className="asso-segment" key={`p-${i}`}>
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
                                discoveryMainStore.updateMainView(featViews.views[i])
                            }}
                        />
                    </Stack>
                    <div className="chart-container">
                        <ReactVega
                            actions={mainVizSetting.debug}
                            spec={spec}
                            dataSource={applyFilter(dataSource, featViews.views[i].filters)}
                        />
                    </div>
                    {
                        featViews.views[i].filters && <div>
                            <h4>filters</h4>
                            {featViews.views[i].filters!.map(f => `${f.field.name || f.field.fid} = ${f.values.join(',')}`).join('\n')}
                        </div>
                    }
                </div>)
            }
        </AssoContainer>
        <DefaultButton disabled={featViews.amount >= featViews.views.length}
            style={{ marginTop: '8px' }}
            text={intl.get('discovery.main.loadMore')}
            onClick={loadMore}
        />
    </div>
}

export default observer(FeatSegment);
