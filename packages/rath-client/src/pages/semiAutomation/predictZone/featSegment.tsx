import React, { Fragment, useCallback } from 'react';
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

const FeatSegment: React.FC = () => {
    const { semiAutoStore, collectionStore, commonStore } = useGlobalStore();
    const { featSpecList, featViews, mainVizSetting, dataSource, autoAsso, hasMainView, fieldMetas } = semiAutoStore;
    const loadMore = useCallback(() => {
        semiAutoStore.increaseRenderAmount('featViews');
    }, [semiAutoStore]);
    const advicePureFeature = useCallback(() => {
        semiAutoStore.featAssociate();
    }, [semiAutoStore]);
    const list = useAsyncViews(featSpecList);
    if (featViews.views.length === 0 && autoAsso.featViews) return <div />;
    return (
        <Fragment>
            {!autoAsso.featViews && (
                <Button disabled={!hasMainView} onClick={advicePureFeature}>
                    <RathIcon name="AddLink" />
                    {intl.get('semiAuto.main.relateFeatures')}
                </Button>
            )}
            <AssoContainer>
                {list.map(
                    (spec, i) =>
                        featViews.views[i] && (
                            <div className="asso-segment" key={`p-${i}`}>
                                {featViews.computing && (
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
                                            semiAutoStore.updateMainView(featViews.views[i]);
                                        }}
                                    >
                                        <RathIcon name="Pinned" />
                                        {intl.get('semiAuto.main.pin')}
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        onClick={() => {
                                            collectionStore.toggleCollectState(
                                                featViews.views[i].fields,
                                                spec,
                                                IVisSpecType.vegaSubset,
                                                featViews.views[i].filters
                                            );
                                        }}
                                    >
                                        <RathIcon
                                            name={
                                                collectionStore.collectionContains(
                                                    featViews.views[i].fields,
                                                    spec,
                                                    IVisSpecType.vegaSubset,
                                                    featViews.views[i].filters
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
                                        dataSource={applyFilters(dataSource, featViews.views[i].filters)}
                                        config={commonStore.themeConfig}
                                    />
                                </div>
                                <div className="chart-desc">
                                    {featViews.views[i].fields
                                        ?.filter((f) => f.analyticType === 'dimension')
                                        .map((f) => f.name || f.fid)
                                        .join(', ')}{' '}
                                    <br />
                                    {featViews.views[i].fields
                                        ?.filter((f) => f.analyticType === 'measure')
                                        .map((f) => f.name || f.fid)
                                        .join(', ')}{' '}
                                    <br />
                                    {featViews.views[i].filters?.map((f) => {
                                        const meta = fieldMetas.find((m) => m.fid === f.fid);
                                        if (!meta) return '';
                                        return `${meta.name || meta.fid} = ${f.type === 'set' ? f.values.join(',') : `[${f.range.join(',')}]`}`;
                                    })}
                                </div>
                            </div>
                        )
                )}
            </AssoContainer>
            <Button disabled={featViews.amount >= featViews.views.length} variant="outline" style={{ marginTop: '8px' }} onClick={loadMore}>
                {intl.get('semiAuto.main.loadMore')}
            </Button>
        </Fragment>
    );
};

export default observer(FeatSegment);
