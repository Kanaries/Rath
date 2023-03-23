import React, { Fragment, useCallback } from 'react';
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
import { FieldBadge } from './fieldBadge';

const PattSegment: React.FC = () => {
    const { semiAutoStore, collectionStore, commonStore } = useGlobalStore();
    const { pattSpecList, pattViews, mainVizSetting, dataSource, autoAsso, hasMainView, fieldMetas } = semiAutoStore;
    const loadMore = useCallback(() => {
        semiAutoStore.increaseRenderAmount('pattViews');
    }, [semiAutoStore])
    const assViews = useCallback(() => {
        semiAutoStore.pattAssociate();
    }, [semiAutoStore])
    const list = useAsyncViews(pattSpecList);
    if (pattViews.views.length === 0 && autoAsso.pattViews) return <div />
    return <Fragment>
        {
            !autoAsso.pattViews && <DefaultButton
                disabled={!hasMainView}
                iconProps={{ iconName: 'ScatterChart' }}
                text={intl.get('semiAuto.main.relatePatterns')} onClick={assViews}
            />
        }
        <AssoContainer>
            {
                list.map((spec, i) => pattViews.views[i] && <div className="asso-segment" key={`p-${i}`}>
                    {
                        pattViews.computing && <LoadingLayer>
                            <Spinner label="loading" />
                        </LoadingLayer>
                    }
                    <Stack horizontal>
                        <CommandButton
                            iconProps={{ iconName: 'Pinned' }}
                            text={intl.get('semiAuto.main.pin')}
                            onClick={() => {
                                semiAutoStore.updateMainView(pattViews.views[i])
                            }}
                        />
                        <CommandButton
                            iconProps={{ iconName: collectionStore.collectionContains(pattViews.views[i].fields, spec, IVisSpecType.vegaSubset, pattViews.views[i].filters) ? 'FavoriteStarFill' : 'FavoriteStar' }}
                            text={intl.get('common.star')}
                            onClick={() => {
                                collectionStore.toggleCollectState(pattViews.views[i].fields, spec, IVisSpecType.vegaSubset, pattViews.views[i].filters)
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
                            dataSource={applyFilters(dataSource, pattViews.views[i].filters)}
                            config={commonStore.themeConfig}
                        />
                    </div>
                    <div className="chart-desc">
                        { pattViews.views[i].fields?.map(f => <FieldBadge semanticType={f.semanticType} key={f.fid}>{f.name || f.fid}</FieldBadge>)} <br />
                        { pattViews.views[i].filters?.map(f => {
                            const meta = fieldMetas.find(m => m.fid === f.fid);
                            if (!meta) return '';
                            return <FieldBadge key={`filter-${f.fid}`} semanticType={meta.semanticType}>
                                {meta.name || meta.fid} = {f.type === 'set' ? f.values.join(',') : `[${f.range.join(',')}]`}
                            </FieldBadge>
                        })}
                    </div>
                </div>)
            }
        </AssoContainer>
        <DefaultButton disabled={pattViews.amount >= pattViews.views.length}
            style={{ marginTop: '8px' }}
            text={intl.get('semiAuto.main.loadMore')}
            onClick={loadMore}
        />
    </Fragment>
}

export default observer(PattSegment);
