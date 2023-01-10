import React, { Fragment, useCallback } from 'react';
import { observer } from 'mobx-react-lite';
import intl from 'react-intl-universal';
import { CommandButton, DefaultButton, PrimaryButton, Spinner, Stack } from '@fluentui/react';
import { applyFilters } from '@kanaries/loa';
import { useGlobalStore } from '../../../store';
import { AssoContainer, LoadingLayer } from '../components';
import ReactVega from '../../../components/react-vega';
import { adviceVisSize } from '../../collection/utils';
import { IVisSpecType } from '../../../interfaces';
import { useAsyncViews } from './utils';

const NeighborSegment: React.FC = () => {
    const { semiAutoStore, collectionStore, commonStore } = useGlobalStore();
    const { neighborSpecList, neighborViews, mainVizSetting, dataSource, autoAsso, hasMainView, fieldMetas } = semiAutoStore;
    const loadMore = useCallback(() => {
        semiAutoStore.increaseRenderAmount('neighborViews');
    }, [semiAutoStore])
    const adviceNeighbors = useCallback(() => {
        semiAutoStore.neighborAssociate()
    }, [semiAutoStore])
    const list = useAsyncViews(neighborSpecList);
    if (neighborViews.views.length === 0 && autoAsso.neighborViews) return <div />
    return <Fragment>
        {
            !autoAsso.neighborViews && <PrimaryButton
                text={intl.get('semiAuto.main.neighbors')}
                iconProps={{ iconName: 'AddLink'}}
                disabled={!hasMainView}
                onClick={adviceNeighbors}
            />
        }
        <AssoContainer>
            {
                list.map((spec, i) => neighborViews.views[i] && <div className="asso-segment" key={`p-${i}`}>
                    {
                        neighborViews.computing && <LoadingLayer>
                            <Spinner label="loading" />
                        </LoadingLayer>
                    }
                    <Stack horizontal>
                        <CommandButton
                            iconProps={{ iconName: 'Pinned' }}
                            text={intl.get('semiAuto.main.pin')}
                            onClick={() => {
                                semiAutoStore.updateMainView(neighborViews.views[i])
                            }}
                        />
                        <CommandButton
                            iconProps={{ iconName: collectionStore.collectionContains(neighborViews.views[i].fields, spec, IVisSpecType.vegaSubset, neighborViews.views[i].filters) ? 'FavoriteStarFill' : 'FavoriteStar' }}
                            text={intl.get('common.star')}
                            onClick={() => {
                                collectionStore.toggleCollectState(neighborViews.views[i].fields, spec, IVisSpecType.vegaSubset, neighborViews.views[i].filters)
                            }}
                        />
                        <CommandButton
                            text={intl.get('megaAuto.commandBar.editing')}
                            iconProps={{ iconName: 'BarChartVerticalEdit'}}
                            onClick={() => {
                                commonStore.visualAnalysisInGraphicWalker(spec)
                            }}
                        />
                    </Stack>
                    <div className="chart-container">
                        <ReactVega
                            actions={mainVizSetting.debug}
                            spec={adviceVisSize(spec, fieldMetas)}
                            dataSource={applyFilters(dataSource, neighborViews.views[i].filters)}
                            config={commonStore.themeConfig}
                        />
                    </div>
                    <div className="chart-desc">
                        { neighborViews.views[i].fields?.filter(f => f.analyticType === 'dimension').map(f => f.name || f.fid).join(', ') } <br />
                        { neighborViews.views[i].fields?.filter(f => f.analyticType === 'measure').map(f => f.name || f.fid).join(', ') } <br />
                        { neighborViews.views[i].filters?.map(f => {
                            const meta = fieldMetas.find(m => m.fid === f.fid);
                            if (!meta) return '';
                            return `${meta.name || meta.fid} = ${f.type === 'set' ? f.values.join(',') : `[${f.range.join(',')}]`}`
                        })}
                    </div>
                </div>)
            }
        </AssoContainer>
        <DefaultButton disabled={neighborViews.amount >= neighborViews.views.length}
            style={{ marginTop: '8px' }}
            text={intl.get('semiAuto.main.loadMore')}
            onClick={loadMore}
        />
    </Fragment>
}

export default observer(NeighborSegment);
