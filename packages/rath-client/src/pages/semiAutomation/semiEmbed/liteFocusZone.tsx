import React, { useCallback, useState } from 'react';
import { observer } from 'mobx-react-lite';
import intl from 'react-intl-universal';
import { Button } from '../../../components/ui/button';
import { RathIcon } from '../../../components/icons';
import { IFieldMeta, IVisSpecType } from '../../../interfaces';
import { useGlobalStore } from '../../../store';
import ViewField from '../../megaAutomation/vizOperation/viewField';
import FieldPlaceholder from '../../../components/fieldPill/fieldPlaceholder';
import { MainViewContainer } from '../components';
import FilterCreationPill from '../../../components/fieldPill/filterCreationPill';
import Narrative from '../narrative';
import MainCanvas from '../focusZone/mainCanvas';
import MiniFloatCanvas from '../focusZone/miniFloatCanvas';
import { adviceVisSize } from '../../collection/utils';

const BUTTON_STYLE = { marginRight: '6px', marginTop: '6px' };

const LiteFocusZone: React.FC = (props) => {
    const { semiAutoStore, commonStore, collectionStore, painterStore } = useGlobalStore();
    const { mainVizSetting, mainView, showMiniFloatView, fieldMetas, neighborKeys } = semiAutoStore;
    const { dataViewQuery, spec } = mainView;
    const [showActions, setShowActions] = useState(false);
    const appendFieldHandler = useCallback(
        (fid: string) => {
            semiAutoStore.addMainViewField(fid);
        },
        [semiAutoStore]
    );

    const editChart = useCallback(() => {
        if (spec) {
            commonStore.visualAnalysisInGraphicWalker(spec);
        }
    }, [spec, commonStore]);

    const paintChart = useCallback(() => {
        if (spec && dataViewQuery) {
            painterStore.analysisInPainter(spec, dataViewQuery);
        }
    }, [spec, painterStore, dataViewQuery]);

    return (
        <MainViewContainer>
            {dataViewQuery && showMiniFloatView && <MiniFloatCanvas pined={dataViewQuery} />}
            <div className="vis-container">
                <div style={{ borderRight: '1px solid var(--border)' }}>
                    <Button
                        variant="ghost"
                        size="icon"
                        style={BUTTON_STYLE}
                        aria-label={intl.get('megaAuto.commandBar.editing')}
                        title={intl.get('megaAuto.commandBar.editing')}
                        disabled={dataViewQuery === null}
                        onClick={editChart}
                    >
                        <RathIcon name="BarChartVerticalEdit" />
                    </Button>
                    <Button
                        variant="ghost"
                        size="icon"
                        style={BUTTON_STYLE}
                        aria-label={intl.get('megaAuto.commandBar.painting')}
                        title={intl.get('megaAuto.commandBar.painting')}
                        disabled={dataViewQuery === null}
                        onClick={paintChart}
                    >
                        <RathIcon name="EditCreate" />
                    </Button>
                    {dataViewQuery && spec && (
                        <Button
                            variant="ghost"
                            size="icon"
                            style={BUTTON_STYLE}
                            aria-label={intl.get('common.star')}
                            title={intl.get('common.star')}
                            onClick={() => {
                                collectionStore.toggleCollectState(fieldMetas, spec, IVisSpecType.vegaSubset, dataViewQuery.filters);
                            }}
                        >
                            <RathIcon
                                name={
                                    collectionStore.collectionContains(fieldMetas, spec, IVisSpecType.vegaSubset, dataViewQuery.filters)
                                        ? 'FavoriteStarFill'
                                        : 'FavoriteStar'
                                }
                            />
                        </Button>
                    )}
                    <Button
                        variant="ghost"
                        size="icon"
                        style={BUTTON_STYLE}
                        aria-label={intl.get('common.settings')}
                        title={intl.get('common.settings')}
                        onClick={() => {
                            semiAutoStore.setShowSettings(true);
                        }}
                    >
                        <RathIcon name="Settings" />
                    </Button>
                    <Button
                        variant="ghost"
                        size="icon"
                        style={BUTTON_STYLE}
                        aria-label={intl.get('common.settings')}
                        title={intl.get('common.settings')}
                        onClick={() => {
                            setShowActions((v) => !v);
                        }}
                    >
                        <RathIcon name={showActions ? 'GroupedAscending' : 'GroupedDescending'} />
                    </Button>
                </div>
                <div>{dataViewQuery && spec && <MainCanvas view={dataViewQuery} spec={adviceVisSize(spec, fieldMetas)} />}</div>
                {mainVizSetting.nlg && (
                    <div style={{ overflow: 'auto' }}>
                        <Narrative />
                    </div>
                )}
            </div>
            <hr style={{ marginTop: '6px' }} />
            {showActions && (
                <div className="fields-container">
                    {dataViewQuery &&
                        dataViewQuery.fields.map((f: IFieldMeta) => (
                            <ViewField
                                key={f.fid}
                                type={f.analyticType}
                                mode={neighborKeys.includes(f.fid) ? 'wildcard' : 'real'}
                                text={f.name || f.fid}
                                onRemove={() => {
                                    semiAutoStore.removeMainViewField(f.fid);
                                }}
                                onDoubleClick={() => {
                                    semiAutoStore.setNeighborKeys(neighborKeys.includes(f.fid) ? [] : [f.fid]);
                                }}
                            />
                        ))}
                    <FieldPlaceholder fields={fieldMetas} onAdd={appendFieldHandler} />
                </div>
            )}
            {showActions && (
                <div className="fields-container">
                    {dataViewQuery &&
                        dataViewQuery.filters &&
                        dataViewQuery.filters.map((f) => {
                            const targetField = fieldMetas.find((m) => m.fid === f.fid);
                            if (!targetField) return null;
                            let filterDesc = `${targetField.name || targetField.fid} ∈ `;
                            filterDesc += f.type === 'range' ? `[${f.range.join(',')}]` : `{${f.values.join(',')}}`;
                            return (
                                <ViewField
                                    key={f.fid}
                                    type={targetField.analyticType}
                                    text={filterDesc}
                                    onRemove={() => {
                                        semiAutoStore.removeMainViewFilter(f.fid);
                                    }}
                                />
                            );
                        })}
                    <FilterCreationPill
                        fields={fieldMetas}
                        onFilterSubmit={(field, filter) => {
                            semiAutoStore.addMainViewFilter(filter);
                        }}
                    />
                </div>
            )}
        </MainViewContainer>
    );
};

export default observer(LiteFocusZone);
