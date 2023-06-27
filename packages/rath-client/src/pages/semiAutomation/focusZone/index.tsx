import React, { useCallback, useMemo, useRef } from 'react';
import { observer } from 'mobx-react-lite';
import { ActionButton, CommandButton, DefaultButton, IContextualMenuProps } from '@fluentui/react';
import intl from 'react-intl-universal';
import { IFieldMeta, IVisSpecType } from '../../../interfaces';
import { useGlobalStore } from '../../../store';
import ViewField from '../../megaAutomation/vizOperation/viewField';
import FieldPlaceholder from '../../../components/fieldPill/fieldPlaceholder';
import { MainViewContainer } from '../components';
import FilterCreationPill from '../../../components/fieldPill/filterCreationPill';
import EncodeCreationPill from '../../../components/fieldPill/encodeCreationPill';
import EditorCore from '../../editor/core/index';
import type { IReactVegaHandler } from '../../../components/react-vega';
import MainCanvas from './mainCanvas';
import MiniFloatCanvas from './miniFloatCanvas';

const BUTTON_STYLE = { marginRight: '1em', marginTop: '1em' };

const FocusZone: React.FC = () => {
    const { semiAutoStore, commonStore, collectionStore, painterStore, editorStore } = useGlobalStore();
    const { mainView, showMiniFloatView, fieldMetas, neighborKeys, mainViewSpecSource } = semiAutoStore;
    const { muteSpec } = editorStore;
    const appendFieldHandler = useCallback(
        (fid: string) => {
            if (mainView.dataViewQuery === null) {
                semiAutoStore.initMainViewWithSingleField(fid);
            } else {
                semiAutoStore.addMainViewField(fid);
            }
        },
        [semiAutoStore, mainView.dataViewQuery]
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
    }, [mainView.spec, mainView.dataViewQuery, painterStore]);

    const viewSpec = useMemo(() => {
        return mainViewSpecSource === 'custom' ? muteSpec : mainView.spec;
    }, [mainView.spec, muteSpec, mainViewSpecSource]);

    const ChartEditButtonProps = useMemo<IContextualMenuProps>(() => {
        return {
            items: [
                {
                    key: 'editingInGW',
                    text: intl.get('megaAuto.commandBar.editInGW'),
                    iconProps: { iconName: 'BarChartVerticalEdit' },
                    onClick: editChart,
                },
                {
                    key: 'editingInEditor',
                    text: intl.get('megaAuto.commandBar.editInEditor'),
                    iconProps: { iconName: 'Edit' },
                    onClick: () => {
                        if (mainView.spec) {
                            editorStore.syncSpec(IVisSpecType.vegaSubset, mainView.spec);
                            semiAutoStore.changeMainViewSpecSource();
                        }
                    },
                },
            ],
        };
    }, [editChart, editorStore, mainView.spec, semiAutoStore]);

    const handler = useRef<IReactVegaHandler>(null);

    return (
        <MainViewContainer>
            {mainView.dataViewQuery && showMiniFloatView && <MiniFloatCanvas pined={mainView.dataViewQuery} />}
            <div className="vis-container">
                <div className="spec">
                    {mainViewSpecSource === 'custom' && (
                        <EditorCore
                            actionPosition="bottom"
                            actionButtons={
                                <DefaultButton
                                    text={intl.get('megaAuto.exitEditor')}
                                    onClick={() => {
                                        semiAutoStore.setMainViewSpecSource('default');
                                    }}
                                />
                            }
                        />
                    )}
                </div>
                <div className="vis">{mainView.dataViewQuery && mainView.spec && <MainCanvas handler={handler} view={mainView.dataViewQuery} spec={viewSpec} />}</div>
            </div>
            <hr style={{ marginTop: '1em' }} />
            <div className="fields-container">
                {mainView.dataViewQuery &&
                    mainView.dataViewQuery.fields.map((f: IFieldMeta) => (
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
            <div className="fields-container">
                {mainView.dataViewQuery &&
                    mainView.dataViewQuery.encodes &&
                    mainView.dataViewQuery.encodes.map((f) => {
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
                {mainView.dataViewQuery && (
                    <EncodeCreationPill
                        fields={mainView.dataViewQuery.fields}
                        onSubmit={(encode) => {
                            semiAutoStore.addFieldEncode2MainViewPattern(encode);
                        }}
                    />
                )}
            </div>
            <div className="action-buttons">
                <CommandButton
                    style={BUTTON_STYLE}
                    text={intl.get('megaAuto.commandBar.editing')}
                    iconProps={{ iconName: 'BarChartVerticalEdit' }}
                    disabled={mainView.dataViewQuery === null}
                    menuProps={ChartEditButtonProps}
                />
                <ActionButton
                    style={BUTTON_STYLE}
                    text={intl.get('megaAuto.commandBar.painting')}
                    iconProps={{ iconName: 'EditCreate' }}
                    disabled={mainView.dataViewQuery === null}
                    onClick={paintChart}
                />
                {mainView.dataViewQuery && mainView.spec && (
                    <ActionButton
                        style={BUTTON_STYLE}
                        iconProps={{
                            iconName: collectionStore.collectionContains(fieldMetas, mainView.spec, IVisSpecType.vegaSubset, mainView.dataViewQuery.filters)
                                ? 'FavoriteStarFill'
                                : 'FavoriteStar',
                        }}
                        text={intl.get('common.star')}
                        onClick={() => {
                            if (mainView.spec && mainView.dataViewQuery) {
                                collectionStore.toggleCollectState(fieldMetas, mainView.spec, IVisSpecType.vegaSubset, mainView.dataViewQuery.filters);
                            }
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
                <ActionButton
                    style={{ marginTop: BUTTON_STYLE.marginTop }}
                    iconProps={{ iconName: 'Download' }}
                    ariaLabel={intl.get('megaAuto.commandBar.download')}
                    title={intl.get('megaAuto.commandBar.download')}
                    text={intl.get('megaAuto.commandBar.download')}
                    disabled={mainView.dataViewQuery === null}
                    onClick={() => {
                        handler.current?.exportImage();
                    }}
                />
            </div>
        </MainViewContainer>
    );
};

export default observer(FocusZone);
