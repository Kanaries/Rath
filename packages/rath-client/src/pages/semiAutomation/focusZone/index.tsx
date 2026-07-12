import React, { useCallback, useMemo, useRef } from 'react';
import { observer } from 'mobx-react-lite';
import intl from 'react-intl-universal';
import { Button } from '../../../components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '../../../components/ui/dropdown-menu';
import { RathIcon } from '../../../components/icons';
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
    const { dataViewQuery, spec } = mainView;
    const { muteSpec } = editorStore;
    const appendFieldHandler = useCallback(
        (fid: string) => {
            if (dataViewQuery === null) {
                semiAutoStore.initMainViewWithSingleField(fid);
            } else {
                semiAutoStore.addMainViewField(fid);
            }
        },
        [semiAutoStore, dataViewQuery]
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
    }, [spec, dataViewQuery, painterStore]);

    const viewSpec = useMemo(() => {
        return mainViewSpecSource === 'custom' ? muteSpec : spec;
    }, [spec, muteSpec, mainViewSpecSource]);

    const handler = useRef<IReactVegaHandler>(null);

    return (
        <MainViewContainer>
            {dataViewQuery && showMiniFloatView && <MiniFloatCanvas pined={dataViewQuery} />}
            <div className="vis-container">
                <div className="spec">
                    {mainViewSpecSource === 'custom' && (
                        <EditorCore
                            actionPosition="bottom"
                            actionButtons={
                                <Button
                                    variant="outline"
                                    onClick={() => {
                                        semiAutoStore.setMainViewSpecSource('default');
                                    }}
                                >
                                    {intl.get('megaAuto.exitEditor')}
                                </Button>
                            }
                        />
                    )}
                </div>
                <div className="vis">{dataViewQuery && spec && <MainCanvas handler={handler} view={dataViewQuery} spec={viewSpec} />}</div>
            </div>
            <hr style={{ marginTop: '1em' }} />
            <div className="fields-container">
                {dataViewQuery &&
                    dataViewQuery.fields.map((f: IFieldMeta) => (
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
            <div className="fields-container">
                {dataViewQuery &&
                    dataViewQuery.encodes &&
                    dataViewQuery.encodes.map((f) => {
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
                {dataViewQuery && (
                    <EncodeCreationPill
                        fields={dataViewQuery.fields}
                        onSubmit={(encode) => {
                            semiAutoStore.addFieldEncode2MainViewPattern(encode);
                        }}
                    />
                )}
            </div>
            <div className="action-buttons">
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" style={BUTTON_STYLE} disabled={dataViewQuery === null}>
                            <RathIcon name="BarChartVerticalEdit" />
                            {intl.get('megaAuto.commandBar.editing')}
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="start">
                        <DropdownMenuItem onSelect={() => editChart()}>
                            <RathIcon name="BarChartVerticalEdit" className="mr-2" />
                            {intl.get('megaAuto.commandBar.editInGW')}
                        </DropdownMenuItem>
                        <DropdownMenuItem
                            onSelect={() => {
                                if (spec) {
                                    editorStore.syncSpec(IVisSpecType.vegaSubset, spec);
                                    semiAutoStore.changeMainViewSpecSource();
                                }
                            }}
                        >
                            <RathIcon name="Edit" className="mr-2" />
                            {intl.get('megaAuto.commandBar.editInEditor')}
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
                <Button variant="ghost" style={BUTTON_STYLE} disabled={dataViewQuery === null} onClick={paintChart}>
                    <RathIcon name="EditCreate" />
                    {intl.get('megaAuto.commandBar.painting')}
                </Button>
                {dataViewQuery && spec && (
                    <Button
                        variant="ghost"
                        style={BUTTON_STYLE}
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
                        {intl.get('common.star')}
                    </Button>
                )}
                <Button
                    variant="ghost"
                    style={BUTTON_STYLE}
                    aria-label={intl.get('common.settings')}
                    title={intl.get('common.settings')}
                    onClick={() => {
                        semiAutoStore.setShowSettings(true);
                    }}
                >
                    <RathIcon name="Settings" />
                    {intl.get('common.settings')}
                </Button>
                <Button
                    variant="ghost"
                    style={{ marginTop: BUTTON_STYLE.marginTop }}
                    aria-label={intl.get('megaAuto.commandBar.download')}
                    title={intl.get('megaAuto.commandBar.download')}
                    disabled={dataViewQuery === null}
                    onClick={() => {
                        handler.current?.exportImage();
                    }}
                >
                    <RathIcon name="Download" />
                    {intl.get('megaAuto.commandBar.download')}
                </Button>
            </div>
        </MainViewContainer>
    );
};

export default observer(FocusZone);
