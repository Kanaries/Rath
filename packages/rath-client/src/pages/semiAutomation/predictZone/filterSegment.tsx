import React, { useCallback, Fragment } from 'react';
import { observer } from 'mobx-react-lite';
import intl from 'react-intl-universal';
import { CommandButton, DefaultButton, Spinner, Stack } from '@fluentui/react';
import { applyFilters } from '@kanaries/loa';
import { useGlobalStore } from '../../../store';
import { AssoContainer, LoadingLayer } from '../components';
import ReactVega from '../../../components/react-vega';
import { adviceVisSize } from '../../collection/utils';
import { IVisSpecType } from '../../../interfaces';
import { useAsyncViews } from './utils';


const FilterSegment: React.FC = () => {
    const { semiAutoStore, collectionStore, commonStore } = useGlobalStore();
    const { filterSpecList, filterViews, mainVizSetting, dataSource, autoAsso, hasMainView, fieldMetas } = semiAutoStore;
    const loadMore = useCallback(() => {
        semiAutoStore.increaseRenderAmount('filterViews');
    }, [semiAutoStore])
    const recommandFilter = useCallback(() => {
        semiAutoStore.filterAssociate();
    }, [semiAutoStore])
    const list = useAsyncViews(filterSpecList);
    if (filterViews.views.length === 0 && autoAsso.filterViews) return <div />
    return <Fragment>
        {
            !autoAsso.filterViews && <DefaultButton text={intl.get('semiAuto.main.pointInterests')}
                iconProps={{ iconName: 'SplitObject' }}
                disabled={!hasMainView}
                onClick={recommandFilter}
            />
        }
        <AssoContainer>
            {
                list.map((spec, i) => filterViews.views[i] && <div className="asso-segment" key={`p-${i}`}>
                    {
                        filterViews.computing && <LoadingLayer>
                            <Spinner label="loading" />
                        </LoadingLayer>
                    }
                    <Stack horizontal>
                        <CommandButton
                            iconProps={{ iconName: 'Pinned' }}
                            text={intl.get('semiAuto.main.pin')}
                            onClick={() => {
                                semiAutoStore.updateMainView(filterViews.views[i])
                            }}
                        />
                        <CommandButton
                            iconProps={{ iconName: collectionStore.collectionContains(filterViews.views[i].fields, spec, IVisSpecType.vegaSubset, filterViews.views[i].filters) ? 'FavoriteStarFill' : 'FavoriteStar' }}
                            text={intl.get('common.star')}
                            onClick={() => {
                                collectionStore.toggleCollectState(filterViews.views[i].fields, spec, IVisSpecType.vegaSubset, filterViews.views[i].filters)
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
                            dataSource={applyFilters(dataSource, filterViews.views[i].filters)}
                            config={commonStore.themeConfig}
                        />
                    </div>
                    <div className="chart-desc">
                        { filterViews.views[i].fields?.filter(f => f.analyticType === 'dimension').map(f => f.name || f.fid).join(', ') } <br />
                        { filterViews.views[i].fields?.filter(f => f.analyticType === 'measure').map(f => f.name || f.fid).join(', ') } <br />
                        { filterViews.views[i].filters?.map(f => {
                            const meta = fieldMetas.find(m => m.fid === f.fid);
                            if (!meta) return '';
                            return `${meta.name || meta.fid} = ${f.type === 'set' ? f.values.join(',') : `[${f.range.join(',')}]`}`
                        })}
                    </div>
                </div>)
            }
        </AssoContainer>
        <DefaultButton disabled={filterViews.amount >= filterViews.views.length}
            style={{ marginTop: '8px' }}
            text={intl.get('semiAuto.main.loadMore')}
            onClick={loadMore}
        />
    </Fragment>
}

export default observer(FilterSegment);
