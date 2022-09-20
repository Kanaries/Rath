import React, { useCallback } from 'react';
import { observer } from 'mobx-react-lite';
import intl from 'react-intl-universal';
import { CommandButton, DefaultButton, PrimaryButton, Spinner, Stack } from '@fluentui/react';

import { useGlobalStore } from '../../../store';
import { AssoContainer, LoadingLayer } from '../components';
import ReactVega from '../../../components/react-vega';
import { applyFilter } from '../utils';

const FeatSegment: React.FC = () => {
    const { semiAutoStore } = useGlobalStore();
    const { featSpecList, featViews, mainVizSetting, dataSource, autoAsso, hasMainView } = semiAutoStore;
    const loadMore = useCallback(() => {
        semiAutoStore.increaseRenderAmount('featViews');
    }, [semiAutoStore])
    const advicePureFeature = useCallback(() => {
        semiAutoStore.featAssociate()
    }, [semiAutoStore])
    if (featViews.views.length === 0 && autoAsso.featViews) return <div />
    return <div className="pure-card">
        <h1 className="ms-fontSize-18">{intl.get('discovery.main.associate.features')}</h1>
        {
            !autoAsso.featViews && <PrimaryButton
                text={intl.get('discovery.main.relateFeatures')}
                iconProps={{ iconName: 'AddLink'}}
                disabled={!hasMainView}
                onClick={advicePureFeature}
            />
        }
        <AssoContainer>
            {
                featSpecList.map((spec, i) => <div className="asso-segment" key={`p-${i}`}>
                    {
                        featViews.computing && <LoadingLayer>
                            <Spinner label="loading" />
                        </LoadingLayer>
                    }
                    <Stack horizontal>
                        <CommandButton
                            iconProps={{ iconName: 'Pinned' }}
                            text={intl.get('discovery.main.pin')}
                            onClick={() => {
                                semiAutoStore.updateMainView(featViews.views[i])
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
                    <div className="chart-desc">
                        { featViews.views[i].fields?.filter(f => f.analyticType === 'dimension').map(f => f.name || f.fid).join(', ') } <br />
                        { featViews.views[i].fields?.filter(f => f.analyticType === 'measure').map(f => f.name || f.fid).join(', ') } <br />
                        { featViews.views[i].filters?.map(f => `${f.field.name || f.field.fid} = ${f.values.join(',')}`).join('\n') }
                    </div>
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
