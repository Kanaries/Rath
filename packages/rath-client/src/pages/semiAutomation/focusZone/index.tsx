import React, { useCallback } from 'react';
import { observer } from 'mobx-react-lite';
import { ActionButton } from '@fluentui/react';
import intl from 'react-intl-universal';
import { IFieldMeta } from '../../../interfaces';
import { useGlobalStore } from '../../../store';
import ViewField from '../../megaAutomation/vizOperation/viewField';
import FieldPlaceholder from '../../../components/fieldPlaceholder';
import { MainViewContainer } from '../components';
import FilterCreationPill from '../../../components/filterCreationPill';
import Narrative from '../narrative';
import EncodeCreationPill from '../../../components/encodeCreationPill';
import MainCanvas from './mainCanvas';
import MiniFloatCanvas from './miniFloatCanvas';

const BUTTON_STYLE = { marginRight: '1em', marginTop: '1em' };

const FocusZone: React.FC = (props) => {
    const { semiAutoStore, commonStore, collectionStore, painterStore } = useGlobalStore();
    const { mainVizSetting, mainView, compareView, showMiniFloatView, mainViewSpec, compareViewSpec, fieldMetas, neighborKeys } =
        semiAutoStore;
    const explainDiff = useCallback(() => {
        if (mainView && compareView) {
            semiAutoStore.explainViewDiff(mainView, compareView);
        }
    }, [mainView, compareView, semiAutoStore]);

    const appendFieldHandler = useCallback(
        (fid: string) => {
            if (mainView === null) {
                semiAutoStore.initMainViewWithSingleField(fid);
            } else {
                semiAutoStore.addMainViewField(fid);
            }
        },
        [semiAutoStore, mainView]
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
                <div>{mainView && mainViewSpec && <MainCanvas view={mainView} spec={mainViewSpec} />}</div>
                <div>{compareView && compareViewSpec && <MainCanvas view={compareView} spec={compareViewSpec} />}</div>
                {mainVizSetting.nlg && (
                    <div style={{ overflow: 'auto' }}>
                        <Narrative />
                    </div>
                )}
            </div>
            <hr style={{ marginTop: '1em' }} />
            <div className="fields-container">
                {mainView &&
                    mainView.fields.map((f: IFieldMeta) => (
                        <ViewField
                            onDoubleClick={() => {
                                semiAutoStore.setNeighborKeys(neighborKeys.includes(f.fid) ? [] : [f.fid]);
                            }}
                            mode={neighborKeys.includes(f.fid) ? 'wildcard' : 'real'}
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
            <div className="fields-container">
                {mainView &&
                    mainView.encodes &&
                    mainView.encodes.map((f) => {
                        if (f.field === undefined)
                            return (
                                <ViewField
                                    key={'_'}
                                    type="measure"
                                    text="count"
                                    onRemove={() => {
                                        semiAutoStore.removeFieldEncodeFromMainViewPattern(f);
                                    }}
                                />
                            );
                        const targetField = fieldMetas.find((m) => m.fid === f.field);
                        if (!targetField) return null;
                        let filterDesc = `${f.aggregate}(${targetField.name || targetField.fid})`;
                        return (
                            <ViewField
                                key={f.field}
                                type={targetField.analyticType}
                                text={filterDesc}
                                onRemove={() => {
                                    semiAutoStore.removeFieldEncodeFromMainViewPattern(f);
                                }}
                            />
                        );
                    })}
                {mainView && (
                    <EncodeCreationPill
                        fields={mainView.fields}
                        onSubmit={(encode) => {
                            semiAutoStore.addFieldEncode2MainViewPattern(encode);
                        }}
                    />
                )}
            </div>
            <div className="action-buttons">
                <ActionButton
                    style={BUTTON_STYLE}
                    text={intl.get('megaAuto.commandBar.editing')}
                    iconProps={{ iconName: 'BarChartVerticalEdit' }}
                    disabled={mainView === null}
                    onClick={editChart}
                />
                <ActionButton
                    style={BUTTON_STYLE}
                    text={intl.get('megaAuto.commandBar.painting')}
                    iconProps={{ iconName: 'EditCreate' }}
                    disabled={mainView === null}
                    onClick={paintChart}
                />
                <ActionButton
                    style={BUTTON_STYLE}
                    text={intl.get('semiAuto.main.explainDiff')}
                    iconProps={{ iconName: 'Compare' }}
                    disabled={mainView === null || compareView === null}
                    onClick={explainDiff}
                />
                {mainView && mainViewSpec && (
                    <ActionButton
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
                <ActionButton
                    style={BUTTON_STYLE}
                    iconProps={{ iconName: 'Settings' }}
                    ariaLabel={intl.get('common.settings')}
                    title={intl.get('common.settings')}
                    text={intl.get('common.settings')}
                    onClick={() => {
                        semiAutoStore.setShowSettings(true);
                    }}
                />
            </div>
        </MainViewContainer>
    );
};

export default observer(FocusZone);
