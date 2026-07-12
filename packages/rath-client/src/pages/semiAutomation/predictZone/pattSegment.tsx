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

const PattSegment: React.FC = () => {
    const { semiAutoStore, collectionStore, commonStore } = useGlobalStore();
    const { pattSpecList, pattViews, mainVizSetting, dataSource, autoAsso, hasMainView, fieldMetas } = semiAutoStore;
    const loadMore = useCallback(() => {
        semiAutoStore.increaseRenderAmount('pattViews');
    }, [semiAutoStore]);
    const assViews = useCallback(() => {
        semiAutoStore.pattAssociate();
    }, [semiAutoStore]);
    const list = useAsyncViews(pattSpecList);
    if (pattViews.views.length === 0 && autoAsso.pattViews) return <div />;
    return (
        <Fragment>
            {!autoAsso.pattViews && (
                <Button variant="outline" disabled={!hasMainView} onClick={assViews}>
                    <RathIcon name="ScatterChart" />
                    {intl.get('semiAuto.main.relatePatterns')}
                </Button>
            )}
            <AssoContainer>
                {list.map(
                    (spec, i) =>
                        pattViews.views[i] && (
                            <div className="asso-segment" key={`p-${i}`}>
                                {pattViews.computing && (
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
                                            semiAutoStore.updateMainView(pattViews.views[i]);
                                        }}
                                    >
                                        <RathIcon name="Pinned" />
                                        {intl.get('semiAuto.main.pin')}
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        onClick={() => {
                                            collectionStore.toggleCollectState(
                                                pattViews.views[i].fields,
                                                spec,
                                                IVisSpecType.vegaSubset,
                                                pattViews.views[i].filters
                                            );
                                        }}
                                    >
                                        <RathIcon
                                            name={
                                                collectionStore.collectionContains(
                                                    pattViews.views[i].fields,
                                                    spec,
                                                    IVisSpecType.vegaSubset,
                                                    pattViews.views[i].filters
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
                                        dataSource={applyFilters(dataSource, pattViews.views[i].filters)}
                                        config={commonStore.themeConfig}
                                    />
                                </div>
                                <div className="chart-desc">
                                    {pattViews.views[i].fields
                                        ?.filter((f) => f.analyticType === 'dimension')
                                        .map((f) => f.name || f.fid)
                                        .join(', ')}{' '}
                                    <br />
                                    {pattViews.views[i].fields
                                        ?.filter((f) => f.analyticType === 'measure')
                                        .map((f) => f.name || f.fid)
                                        .join(', ')}{' '}
                                    <br />
                                    {pattViews.views[i].filters?.map((f) => {
                                        const meta = fieldMetas.find((m) => m.fid === f.fid);
                                        if (!meta) return '';
                                        return `${meta.name || meta.fid} = ${f.type === 'set' ? f.values.join(',') : `[${f.range.join(',')}]`}`;
                                    })}
                                </div>
                            </div>
                        )
                )}
            </AssoContainer>
            <Button disabled={pattViews.amount >= pattViews.views.length} variant="outline" style={{ marginTop: '8px' }} onClick={loadMore}>
                {intl.get('semiAuto.main.loadMore')}
            </Button>
        </Fragment>
    );
};

export default observer(PattSegment);
