import React, { useCallback, Fragment } from 'react';
import { observer } from 'mobx-react-lite';
import intl from 'react-intl-universal';
import { applyFilters } from '@kanaries/loa';
import { Button } from '../../../components/ui/button';
import { Spinner } from '../../../components/ui/spinner';
import { RathIcon } from '../../../components/icons';
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
    }, [semiAutoStore]);
    const recommandFilter = useCallback(() => {
        semiAutoStore.filterAssociate();
    }, [semiAutoStore]);
    const list = useAsyncViews(filterSpecList);
    if (filterViews.views.length === 0 && autoAsso.filterViews) return <div />;
    return (
        <Fragment>
            {!autoAsso.filterViews && (
                <Button variant="outline" disabled={!hasMainView} onClick={recommandFilter}>
                    <RathIcon name="SplitObject" />
                    {intl.get('semiAuto.main.pointInterests')}
                </Button>
            )}
            <AssoContainer>
                {list.map(
                    (spec, i) =>
                        filterViews.views[i] && (
                            <div className="asso-segment" key={`p-${i}`}>
                                {filterViews.computing && (
                                    <LoadingLayer>
                                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                            <Spinner aria-hidden="true" />
                                            <span>loading</span>
                                        </div>
                                    </LoadingLayer>
                                )}
                                <div className="flex items-center gap-2">
                                    <Button
                                        variant="ghost"
                                        onClick={() => {
                                            semiAutoStore.updateMainView(filterViews.views[i]);
                                        }}
                                    >
                                        <RathIcon name="Pinned" />
                                        {intl.get('semiAuto.main.pin')}
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        onClick={() => {
                                            collectionStore.toggleCollectState(
                                                filterViews.views[i].fields,
                                                spec,
                                                IVisSpecType.vegaSubset,
                                                filterViews.views[i].filters
                                            );
                                        }}
                                    >
                                        <RathIcon
                                            name={
                                                collectionStore.collectionContains(
                                                    filterViews.views[i].fields,
                                                    spec,
                                                    IVisSpecType.vegaSubset,
                                                    filterViews.views[i].filters
                                                )
                                                    ? 'FavoriteStarFill'
                                                    : 'FavoriteStar'
                                            }
                                        />
                                        {intl.get('common.star')}
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        onClick={() => {
                                            commonStore.visualAnalysisInGraphicWalker(spec);
                                        }}
                                    >
                                        <RathIcon name="BarChartVerticalEdit" />
                                        {intl.get('megaAuto.commandBar.editing')}
                                    </Button>
                                </div>
                                <div className="chart-container">
                                    <ReactVega
                                        actions={mainVizSetting.debug}
                                        spec={adviceVisSize(spec, fieldMetas)}
                                        dataSource={applyFilters(dataSource, filterViews.views[i].filters)}
                                        config={commonStore.themeConfig}
                                    />
                                </div>
                                <div className="chart-desc">
                                    {filterViews.views[i].fields
                                        ?.filter((f) => f.analyticType === 'dimension')
                                        .map((f) => f.name || f.fid)
                                        .join(', ')}{' '}
                                    <br />
                                    {filterViews.views[i].fields
                                        ?.filter((f) => f.analyticType === 'measure')
                                        .map((f) => f.name || f.fid)
                                        .join(', ')}{' '}
                                    <br />
                                    {filterViews.views[i].filters?.map((f) => {
                                        const meta = fieldMetas.find((m) => m.fid === f.fid);
                                        if (!meta) return '';
                                        return `${meta.name || meta.fid} = ${f.type === 'set' ? f.values.join(',') : `[${f.range.join(',')}]`}`;
                                    })}
                                </div>
                            </div>
                        )
                )}
            </AssoContainer>
            <Button disabled={filterViews.amount >= filterViews.views.length} variant="outline" style={{ marginTop: '8px' }} onClick={loadMore}>
                {intl.get('semiAuto.main.loadMore')}
            </Button>
        </Fragment>
    );
};

export default observer(FilterSegment);
