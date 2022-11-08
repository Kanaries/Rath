import React, { useCallback, useState } from 'react';
import { observer } from 'mobx-react-lite';
import { IconButton, Stack } from '@fluentui/react';
import intl from 'react-intl-universal';
import { IFieldMeta } from '../../../interfaces';
import { useGlobalStore } from '../../../store';
import ViewField from '../../megaAutomation/vizOperation/viewField';
import FieldPlaceholder from '../../../components/fieldPlaceholder';
import { MainViewContainer } from '../components';
import FilterCreationPill from '../../../components/filterCreationPill';
import Narrative from '../narrative';
import MainCanvas from '../focusZone/mainCanvas';
import MiniFloatCanvas from '../focusZone/miniFloatCanvas';
import { adviceVisSize } from '../../collection/utils';

const BUTTON_STYLE = { marginRight: '6px', marginTop: '6px' };

const LiteFocusZone: React.FC = (props) => {
    const { semiAutoStore, commonStore, collectionStore, painterStore } = useGlobalStore();
    const { mainVizSetting, mainView, showMiniFloatView, mainViewSpec, fieldMetas } = semiAutoStore;
    const [showActions, setShowActions] = useState(false);
    const appendFieldHandler = useCallback(
        (fid: string) => {
            semiAutoStore.addMainViewField(fid);
        },
        [semiAutoStore]
    );

    const editChart = useCallback(() => {
        if (mainViewSpec) {
            commonStore.visualAnalysisInGraphicWalker(mainViewSpec);
        }
    }, [mainViewSpec, commonStore]);

    const paintChart = useCallback(() => {
        if (mainViewSpec && mainView) {
            painterStore.analysisInPainter(mainViewSpec, mainView);
        }
    }, [mainViewSpec, painterStore, mainView]);

    return (
        <MainViewContainer>
            {mainView && showMiniFloatView && <MiniFloatCanvas pined={mainView} />}
            <div className="vis-container">
                <Stack style={{ borderRight: '1px solid #eee' }}>
                    <IconButton
                        style={BUTTON_STYLE}
                        text={intl.get('megaAuto.commandBar.editing')}
                        iconProps={{ iconName: 'BarChartVerticalEdit' }}
                        disabled={mainView === null}
                        onClick={editChart}
                    />
                    <IconButton
                        style={BUTTON_STYLE}
                        text={intl.get('megaAuto.commandBar.painting')}
                        iconProps={{ iconName: 'EditCreate' }}
                        disabled={mainView === null}
                        onClick={paintChart}
                    />
                    {mainView && mainViewSpec && (
                        <IconButton
                            style={BUTTON_STYLE}
                            iconProps={{
                                iconName: collectionStore.collectionContains(fieldMetas, mainViewSpec, mainView.filters)
                                    ? 'FavoriteStarFill'
                                    : 'FavoriteStar',
                            }}
                            text={intl.get('common.star')}
                            onClick={() => {
                                collectionStore.toggleCollectState(fieldMetas, mainViewSpec, mainView.filters);
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
                    {mainView && mainViewSpec && (
                        <MainCanvas view={mainView} spec={adviceVisSize(mainViewSpec, fieldMetas)} />
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
                    {mainView &&
                        mainView.fields.map((f: IFieldMeta) => (
                            <ViewField
                                key={f.fid}
                                type={f.analyticType}
                                text={f.name || f.fid}
                                onRemove={() => {
                                    semiAutoStore.removeMainViewField(f.fid);
                                }}
                            />
                        ))}
                    <FieldPlaceholder fields={fieldMetas} onAdd={appendFieldHandler} />
                </div>
            )}
            {showActions && (
                <div className="fields-container">
                    {mainView &&
                        mainView.filters &&
                        mainView.filters.map((f) => {
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
