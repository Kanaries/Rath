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
    const [showActions, setShowActions] = useState(false);
    const appendFieldHandler = useCallback(
        (fid: string) => {
            semiAutoStore.addMainViewField(fid);
        },
        [semiAutoStore]
    );

    const editChart = useCallback(() => {
        if (mainView.spec) {
            commonStore.visualAnalysisInGraphicWalker(mainView.spec);
        }
    }, [mainView.spec, commonStore]);

    const paintChart = useCallback(() => {
        if (mainView.spec && mainView.dataViewQuery) {
            painterStore.analysisInPainter(mainView.spec, mainView.dataViewQuery);
        }
    }, [mainView.spec, painterStore, mainView.dataViewQuery]);

    return (
        <MainViewContainer>
            {mainView.dataViewQuery && showMiniFloatView && <MiniFloatCanvas pined={mainView.dataViewQuery} />}
            <div className="vis-container">
                <Stack style={{ borderRight: '1px solid #eee' }}>
                    <IconButton
                        style={BUTTON_STYLE}
                        text={intl.get('megaAuto.commandBar.editing')}
                        iconProps={{ iconName: 'BarChartVerticalEdit' }}
                        disabled={mainView.dataViewQuery === null}
                        onClick={editChart}
                    />
                    <IconButton
                        style={BUTTON_STYLE}
                        text={intl.get('megaAuto.commandBar.painting')}
                        iconProps={{ iconName: 'EditCreate' }}
                        disabled={mainView.dataViewQuery === null}
                        onClick={paintChart}
                    />
                    {mainView.dataViewQuery && mainView.spec && (
                        <IconButton
                            style={BUTTON_STYLE}
                            iconProps={{
                                iconName: collectionStore.collectionContains(fieldMetas, mainView.spec, IVisSpecType.vegaSubset, mainView.dataViewQuery.filters)
                                    ? 'FavoriteStarFill'
                                    : 'FavoriteStar',
                            }}
                            text={intl.get('common.star')}
                            onClick={() => {
                                if (mainView.dataViewQuery && mainView.spec) {
                                    collectionStore.toggleCollectState(fieldMetas, mainView.spec, IVisSpecType.vegaSubset, mainView.dataViewQuery.filters);
                                }
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
                    {mainView.dataViewQuery && mainView.spec && (
                        <MainCanvas view={mainView.dataViewQuery} spec={adviceVisSize(mainView.spec, fieldMetas)} />
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
                    {mainView.dataViewQuery &&
                        mainView.dataViewQuery.fields.map((f: IFieldMeta) => (
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
                    {mainView.dataViewQuery &&
                        mainView.dataViewQuery.filters &&
                        mainView.dataViewQuery.filters.map((f) => {
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
