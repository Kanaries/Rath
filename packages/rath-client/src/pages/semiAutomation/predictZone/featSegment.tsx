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
import { FieldBadge } from './fieldBadge';

const FeatSegment: React.FC = () => {
    const { semiAutoStore, collectionStore, commonStore } = useGlobalStore();
    const { featSpecList, featViews, mainVizSetting, dataSource, autoAsso, hasMainView, fieldMetas } = semiAutoStore;
    const loadMore = useCallback(() => {
        semiAutoStore.increaseRenderAmount('featViews');
    }, [semiAutoStore])
    const advicePureFeature = useCallback(() => {
        semiAutoStore.featAssociate()
    }, [semiAutoStore])
    const list = useAsyncViews(featSpecList);
    if (featViews.views.length === 0 && autoAsso.featViews) return <div />
    return <Fragment>
        {
            !autoAsso.featViews && <PrimaryButton
                text={intl.get('semiAuto.main.relateFeatures')}
                iconProps={{ iconName: 'AddLink'}}
                disabled={!hasMainView}
                onClick={advicePureFeature}
            />
        }
        <AssoContainer>
            {
                list.map((spec, i) => featViews.views[i] && <div className="asso-segment" key={`p-${i}`}>
                    {
                        featViews.computing && <LoadingLayer>
                            <Spinner label="loading" />
                        </LoadingLayer>
                    }
                    <Stack horizontal>
                        <CommandButton
                            iconProps={{ iconName: 'Pinned' }}
                            text={intl.get('semiAuto.main.pin')}
                            onClick={() => {
                                semiAutoStore.updateMainView(featViews.views[i])
                            }}
                        />
                        <CommandButton
                            iconProps={{ iconName: collectionStore.collectionContains(featViews.views[i].fields, spec, IVisSpecType.vegaSubset, featViews.views[i].filters) ? 'FavoriteStarFill' : 'FavoriteStar' }}
                            text={intl.get('common.star')}
                            onClick={() => {
                                collectionStore.toggleCollectState(featViews.views[i].fields, spec, IVisSpecType.vegaSubset, featViews.views[i].filters)
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
                            dataSource={applyFilters(dataSource, featViews.views[i].filters)}
                            config={commonStore.themeConfig}
                        />
                    </div>
                    <div className="chart-desc">
                        { featViews.views[i].fields?.map(f => <FieldBadge semanticType={f.semanticType} key={f.fid}>{f.name || f.fid}</FieldBadge>)} <br />
                        { featViews.views[i].filters?.map(f => {
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
        <DefaultButton disabled={featViews.amount >= featViews.views.length}
            style={{ marginTop: '8px' }}
            text={intl.get('semiAuto.main.loadMore')}
            onClick={loadMore}
        />
    </Fragment>
}

export default observer(FeatSegment);
