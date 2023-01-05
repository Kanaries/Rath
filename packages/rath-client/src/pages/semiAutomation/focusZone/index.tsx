import React, { useCallback, useMemo } from 'react';
import { observer } from 'mobx-react-lite';
import { DefaultButton, Position, SpinButton, Toggle } from '@fluentui/react';
import intl from 'react-intl-universal';
import styled from 'styled-components';
import { ArrowsPointingOutIcon, ChatBubbleLeftEllipsisIcon, Cog8ToothIcon, CommandLineIcon, CubeIcon, CubeTransparentIcon, LockClosedIcon, LockOpenIcon, MagnifyingGlassCircleIcon, PaintBrushIcon, PencilIcon, PencilSquareIcon, RectangleGroupIcon, StarIcon, TableCellsIcon, ViewfinderCircleIcon, WrenchIcon } from '@heroicons/react/24/solid';
import { IFieldMeta, IResizeMode, IVisSpecType } from '../../../interfaces';
import { useGlobalStore } from '../../../store';
import ViewField from '../../megaAutomation/vizOperation/viewField';
import FieldPlaceholder from '../../../components/fieldPill/fieldPlaceholder';
import { MainViewContainer } from '../components';
import FilterCreationPill from '../../../components/fieldPill/filterCreationPill';
import Narrative from '../narrative';
import EncodeCreationPill from '../../../components/fieldPill/encodeCreationPill';
import EditorCore from '../../editor/core/index';
import Toolbar, { ToolbarItemProps } from '../../../components/toolbar';
import MainCanvas from './mainCanvas';
import MiniFloatCanvas from './miniFloatCanvas';


const FormContainer = styled.div`
    margin: 2px;
    border-radius: 1.2px;
    padding: 0.5em;
`;

const FocusZone: React.FC = (props) => {
    const { semiAutoStore, commonStore, collectionStore, painterStore, editorStore } = useGlobalStore();
    const { mainVizSetting, mainView, showMiniFloatView, mainViewSpec, fieldMetas, neighborKeys, mainViewSpecSource } = semiAutoStore;
    const { muteSpec } = editorStore;
    const { interactive, resize, debug, nlg, excludeScaleZero } = mainVizSetting;
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

    const viewSpec = useMemo(() => {
        return mainViewSpecSource === 'custom' ? muteSpec : mainViewSpec;
    }, [mainViewSpec, muteSpec, mainViewSpecSource]);

    const viewExists = Boolean(mainViewSpec && mainView);

    const starred = Boolean(
        mainViewSpec && mainView && collectionStore.collectionContains(fieldMetas, mainViewSpec, IVisSpecType.vegaSubset, mainView.filters)
    );

    const { settings, autoAsso } = semiAutoStore;
    const { vizAlgo } = settings;

    const items: ToolbarItemProps[] = [
        {
            key: 'star',
            icon: StarIcon,
            label: intl.get('common.star'),
            checked: starred,
            onChange: () => {
                if (mainViewSpec && mainView) {
                    collectionStore.toggleCollectState(fieldMetas, mainViewSpec, IVisSpecType.vegaSubset, mainView.filters);
                }
            },
            disabled: !viewExists,
        },
        '-',
        {
            key: 'editing',
            icon: PencilIcon,
            label: intl.get('megaAuto.commandBar.editing'),
            disabled: !viewExists,
            menu: {
                items: [
                    {
                        key: 'editingInGW',
                        icon: TableCellsIcon,
                        label: intl.get('megaAuto.commandBar.editInGW'),
                        onClick: () => editChart(),
                    },
                    {
                        key: 'editingInEditor',
                        icon: PencilSquareIcon,
                        label: intl.get('megaAuto.commandBar.editInEditor'),
                        onClick: () => {
                            if (mainViewSpec) {
                                editorStore.syncSpec(IVisSpecType.vegaSubset, mainViewSpec);
                                semiAutoStore.changeMainViewSpecSource();
                            }
                        },
                    },
                ],
            },
        },
        {
            key: 'painting',
            icon: PaintBrushIcon,
            label: intl.get('megaAuto.commandBar.painting'),
            onClick: () => paintChart(),
            disabled: !viewExists,
        },
        '-',
        {
            key: 'debug',
            icon: WrenchIcon,
            label: intl.get('megaAuto.operation.debug'),
            checked: debug,
            onChange: checked => {
                semiAutoStore.updateMainVizSettings(s => {
                    s.debug = checked;
                });
            },
        },
        {
            key: 'advanced_options',
            icon: Cog8ToothIcon,
            label: intl.get('common.advanced_options'),
            menu: {
                items: [
                    {
                        key: 'viz_sys',
                        icon: CommandLineIcon,
                        label: intl.get('semiAuto.main.vizsys.title'),
                        value: vizAlgo,
                        options: [
                            {
                                key: 'lite',
                                icon: CubeTransparentIcon,
                                label: intl.get('semiAuto.main.vizsys.lite'),
                            },
                            {
                                key: 'strict',
                                icon: CubeIcon,
                                label: intl.get('semiAuto.main.vizsys.strict'),
                            },
                        ],
                        onSelect: key => {
                            semiAutoStore.updateSettings('vizAlgo', key as typeof vizAlgo);
                        },
                    },
                    {
                        key: 'auto_prediction',
                        icon: RectangleGroupIcon,
                        label: 'Auto Prediction',
                        form: (
                            <FormContainer>
                                <Toggle checked={autoAsso.featViews} onText="Auto" offText="Manual" label="features" onChange={(e, checked) => {
                                    semiAutoStore.updateAutoAssoConfig('featViews', Boolean(checked))
                                }} />
                                <Toggle checked={autoAsso.pattViews} onText="Auto" offText="Manual" label="patterns" onChange={(e, checked) => {
                                    semiAutoStore.updateAutoAssoConfig('pattViews', Boolean(checked))
                                }} />
                                <Toggle checked={autoAsso.filterViews} onText="Auto" offText="Manual" label="subsets" onChange={(e, checked) => {
                                    semiAutoStore.updateAutoAssoConfig('filterViews', Boolean(checked))
                                }} />
                                <Toggle checked={autoAsso.neighborViews} onText="Auto" offText="Manual" label="neighbors" onChange={(e, checked) => {
                                    semiAutoStore.updateAutoAssoConfig('neighborViews', Boolean(checked))
                                }} />
                            </FormContainer>
                        ),
                    },
                    {
                        key: 'excludeScaleZero',
                        icon: ViewfinderCircleIcon,
                        label: intl.get('megaAuto.operation.excludeScaleZero'),
                        checked: excludeScaleZero,
                        onChange: checked => {
                            semiAutoStore.updateMainVizSettings(s => {
                                s.excludeScaleZero = checked;
                            });
                        },
                    },
                    {
                        key: 'zoom',
                        icon: MagnifyingGlassCircleIcon,
                        label: intl.get('megaAuto.operation.zoom'),
                        checked: interactive,
                        onChange: checked => {
                            semiAutoStore.updateMainVizSettings(s => {
                                s.interactive = checked;
                            });
                        },
                    },
                    {
                        key: 'scale',
                        icon: ArrowsPointingOutIcon,
                        label: intl.get('megaAuto.operation.resize'),
                        value: resize.mode,
                        options: [
                            {
                                label: intl.get('megaAuto.operation.resizeMode.none'),
                                icon: LockClosedIcon,
                                key: IResizeMode.auto,
                            },
                            {
                                label: intl.get('megaAuto.operation.resizeMode.resizable'),
                                icon: LockOpenIcon,
                                key: IResizeMode.control,
                            },
                        ],
                        onSelect: value => {
                            semiAutoStore.updateMainVizSettings(s => {
                                s.resize.mode = value as typeof resize.mode;
                            });
                        },
                        form: resize.mode === IResizeMode.control ? (
                            <FormContainer>
                                <SpinButton label="width"
                                    labelPosition={Position.top}
                                    value={`${resize.width}`}
                                    style={{ width: '32px' }}
                                    min={0}
                                    max={1000}
                                    step={10}
                                    onValidate={v => {
                                        semiAutoStore.updateMainVizSettings(s => {
                                            s.resize.width = parseInt(v);
                                        });
                                    }}
                                    onIncrement={() => {
                                        semiAutoStore.updateMainVizSettings(s => {
                                            s.resize.width = Math.min(resize.width + 10, 1000);
                                        });
                                    }}
                                    onDecrement={() => {
                                        semiAutoStore.updateMainVizSettings(s => {
                                            s.resize.width = Math.max(resize.width - 10, 10);
                                        });
                                    }}
                                />
                                <SpinButton label="height"
                                    labelPosition={Position.top}
                                    value={`${resize.height}`}
                                    min={0}
                                    max={1000}
                                    step={10}
                                    style={{ width: '32px' }}
                                    onValidate={v => {
                                        semiAutoStore.updateMainVizSettings(s => {
                                            s.resize.height = parseInt(v);
                                        });
                                    }}
                                    onIncrement={() => {
                                        semiAutoStore.updateMainVizSettings(s => {
                                            s.resize.height = Math.min(resize.height + 10, 1000);
                                        });
                                    }}
                                    onDecrement={() => {
                                        semiAutoStore.updateMainVizSettings(s => {
                                            s.resize.height = Math.max(resize.height - 10, 10);
                                        });
                                    }}
                                />
                            </FormContainer>
                        ) : undefined,
                    },
                    '-',
                    {
                        key: 'nlg',
                        icon: ChatBubbleLeftEllipsisIcon,
                        label: 'NLG(beta)',
                        checked: nlg,
                        onChange: checked => {
                            semiAutoStore.updateMainVizSettings(s => {
                                s.nlg = checked;
                            });
                        },
                    },
                ],
            },
            disabled: !viewExists,
        },
    ];

    return (
        <MainViewContainer>
            <Toolbar
                items={items}
                styles={{ root: { marginBottom: '2em' } }}
            />
            {mainView && showMiniFloatView && <MiniFloatCanvas pined={mainView} />}
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
                <div className="vis">{mainView && mainViewSpec && <MainCanvas view={mainView} spec={viewSpec} />}</div>
                {mainVizSetting.nlg && (
                    <div style={{ overflow: 'auto' }}>
                        <Narrative />
                    </div>
                )}
            </div>
            <hr style={{ marginTop: '1em', border: 'none' }} />
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
        </MainViewContainer>
    );
};

export default observer(FocusZone);
