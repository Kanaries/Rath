import React, { useCallback, useState } from 'react';
import { observer } from 'mobx-react-lite';
import { IconButton, Stack } from '@fluentui/react';
import intl from 'react-intl-universal';
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
                <Stack style={{ borderRight: '1px solid #eee' }}>
                    <IconButton
                        style={BUTTON_STYLE}
                        text={intl.get('megaAuto.commandBar.editing')}
                        iconProps={{ iconName: 'BarChartVerticalEdit' }}
                        disabled={dataViewQuery === null}
                        onClick={editChart}
                    />
                    <IconButton
                        style={BUTTON_STYLE}
                        text={intl.get('megaAuto.commandBar.painting')}
                        iconProps={{ iconName: 'EditCreate' }}
                        disabled={dataViewQuery === null}
                        onClick={paintChart}
                    />
                    {dataViewQuery && spec && (
                        <IconButton
                            style={BUTTON_STYLE}
                            iconProps={{
                                iconName: collectionStore.collectionContains(fieldMetas, spec, IVisSpecType.vegaSubset, dataViewQuery.filters)
                                    ? 'FavoriteStarFill'
                                    : 'FavoriteStar',
                            }}
                            text={intl.get('common.star')}
                            onClick={() => {
                                collectionStore.toggleCollectState(fieldMetas, spec, IVisSpecType.vegaSubset, dataViewQuery.filters); 
                            }}
                        />
                    )}
                    <IconButton
                        style={BUTTON_STYLE}
                        iconProps={{ iconName: 'Settings' }}
                        ariaLabel={intl.get('common.settings')}
                        title={intl.get('common.settings')}
                        text={intl.get('common.settings')}
                        onClick={() => {
                            semiAutoStore.setShowSettings(true);
                        }}
                    />
                    <IconButton
                        style={BUTTON_STYLE}
                        iconProps={{ iconName: showActions ? 'GroupedAscending' : 'GroupedDescending' }}
                        ariaLabel={intl.get('common.settings')}
                        title={intl.get('common.settings')}
                        text={intl.get('common.settings')}
                        onClick={() => {
                            setShowActions((v) => !v);
                        }}
                    />
                </Stack>
                <div>
                    {dataViewQuery && spec && (
                        <MainCanvas view={dataViewQuery} spec={adviceVisSize(spec, fieldMetas)} />
                    )}
                </div>
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
