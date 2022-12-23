import React, { useCallback, useMemo } from 'react';
import intl from 'react-intl-universal';
import { observer } from 'mobx-react-lite';
import { toJS } from 'mobx';
import styled from 'styled-components';
import { Position, Slider, SpinButton } from '@fluentui/react';
import {
    AdjustmentsHorizontalIcon, ArrowsPointingOutIcon, ChatBubbleLeftEllipsisIcon, Cog8ToothIcon, FunnelIcon, LightBulbIcon, LockClosedIcon, LockOpenIcon, MagnifyingGlassCircleIcon, PaintBrushIcon, PencilIcon, PencilSquareIcon, StarIcon, TableCellsIcon, ViewfinderCircleIcon
} from '@heroicons/react/24/solid';
import { useGlobalStore } from '../../../store';
import { IResizeMode, IVisSpecType } from '../../../interfaces';
import Toolbar, { ToolbarItemProps } from '../../../components/toolbar';
import { ToolbarSelectButtonItem } from '../../../components/toolbar/toolbar-select-button';


const FormContainer = styled.div`
    margin: 2px;
    border-radius: 1.2px;
    padding: 0.5em;
    background-color: #f2f2f2;
`;

interface OperationBarProps {}
const OperationBar: React.FC<OperationBarProps> = props => {
    const { megaAutoStore, commonStore, collectionStore, painterStore, editorStore } = useGlobalStore();
    const { taskMode } = commonStore;
    const { mainViewSpec, mainViewPattern, visualConfig, nlgThreshold } = megaAutoStore;

    const { nlg } = visualConfig;

    const customizeAnalysis = useCallback(() => {
        if (mainViewSpec) {
            commonStore.visualAnalysisInGraphicWalker(mainViewSpec)
        }
    }, [mainViewSpec, commonStore])

    const analysisInPainter = useCallback(() => {
        if (mainViewSpec && mainViewPattern) {
            painterStore.analysisInPainter(mainViewSpec, mainViewPattern)
        }
    }, [mainViewSpec, mainViewPattern, painterStore]);

    const resizeModeList = useMemo<ToolbarSelectButtonItem['options']>(() => {
        return [
            {
                key: IResizeMode.auto,
                label: intl.get('megaAuto.operation.resizeMode.none'),
                icon: LockClosedIcon,
            },
            {
                key: IResizeMode.control,
                label: intl.get('megaAuto.operation.resizeMode.resizable'),
                icon: LockOpenIcon,
            },
        ];
    }, []);

    const viewExists = !(mainViewPattern === null || mainViewSpec === null);
    const starred = viewExists && (() => {
        const viewFields = toJS(mainViewPattern.fields);
        const viewSpec = toJS(mainViewSpec);
        return collectionStore.collectionContains(viewFields, viewSpec, IVisSpecType.vegaSubset);
    })();

    const items: ToolbarItemProps[] = [
        {
            key: 'star',
            icon: StarIcon,
            label: intl.get('common.star'),
            checked: starred,
            onChange: () => {
                if (mainViewPattern && mainViewSpec) {
                    collectionStore.toggleCollectState(toJS(mainViewPattern.fields), toJS(mainViewSpec), IVisSpecType.vegaSubset)
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
                        onClick: () => customizeAnalysis(),
                    },
                    {
                        key: 'editingInEditor',
                        icon: PencilSquareIcon,
                        label: intl.get('megaAuto.commandBar.editInEditor'),
                        onClick: () => {
                            if (mainViewPattern && mainViewSpec) {
                                editorStore.syncSpec(IVisSpecType.vegaSubset, mainViewSpec)
                                megaAutoStore.changeMainViewSpecSource()
                            }
                        },
                    },
                ],
            },
        },
        {
            key: 'scale',
            icon: ArrowsPointingOutIcon,
            label: intl.get('megaAuto.operation.resize'),
            options: resizeModeList,
            value: visualConfig.resize,
            onSelect: key => {
                megaAutoStore.setVisualConig(cfg => {
                    cfg.resize = key as IResizeMode;
                });
            },
            form: visualConfig.resize === IResizeMode.control ? (
                <FormContainer>
                    <SpinButton
                        label="width"
                        labelPosition={Position.top}
                        value={visualConfig.resizeConfig.width.toString()}
                        style={{ width: '32px' }}
                        min={0}
                        max={1000}
                        step={10}
                        onValidate={(v) => {
                            megaAutoStore.setVisualConig((cnf) => {
                                cnf.resizeConfig.width = parseInt(v);
                            });
                        }}
                        onIncrement={() => {
                            megaAutoStore.setVisualConig((cnf) => {
                                cnf.resizeConfig.width = Math.min(cnf.resizeConfig.width + 10, 1000);
                            });
                        }}
                        onDecrement={() => {
                            megaAutoStore.setVisualConig((cnf) => {
                                cnf.resizeConfig.width = Math.max(cnf.resizeConfig.width - 10, 10);
                            });
                        }}
                    />
                    <SpinButton
                        label="height"
                        labelPosition={Position.top}
                        value={visualConfig.resizeConfig.height.toString()}
                        min={0}
                        max={1000}
                        step={10}
                        style={{ width: '32px' }}
                        onValidate={(v) => {
                            megaAutoStore.setVisualConig((cnf) => {
                                cnf.resizeConfig.height = parseInt(v);
                            });
                        }}
                        onIncrement={() => {
                            megaAutoStore.setVisualConig((cnf) => {
                                cnf.resizeConfig.height = Math.min(cnf.resizeConfig.height + 10, 1000);
                            });
                        }}
                        onDecrement={() => {
                            megaAutoStore.setVisualConig((cnf) => {
                                cnf.resizeConfig.height = Math.max(cnf.resizeConfig.height - 10, 10);
                            });
                        }}
                    />
                </FormContainer>
            ) : undefined,
        },
        '-',
        {
            key: 'painting',
            icon: PaintBrushIcon,
            label: intl.get('megaAuto.commandBar.painting'),
            onClick: () => analysisInPainter(),
            disabled: !viewExists,
        },
        {
            key: 'associate',
            icon: LightBulbIcon,
            label: intl.get('megaAuto.commandBar.associate'),
            onClick: () => megaAutoStore.getAssociatedViews(taskMode),
            disabled: !viewExists,
        },
        {
            key: 'constraints',
            icon: AdjustmentsHorizontalIcon,
            label: intl.get('megaAuto.commandBar.constraints'),
            onClick: () => {
                megaAutoStore.setShowContraints(true);
            },
            disabled: true,
        },
        '-',
        {
            key: 'advanced_options',
            icon: Cog8ToothIcon,
            label: intl.get('common.advanced_options'),
            menu: {
                items: [
                    {
                        key: 'excludeScaleZero',
                        icon: ViewfinderCircleIcon,
                        label: intl.get('megaAuto.operation.excludeScaleZero'),
                        checked: visualConfig.excludeScaleZero,
                        onChange: checked => {
                            megaAutoStore.setVisualConig((cnf) => {
                                cnf.excludeScaleZero = checked;
                            });
                        },
                    },
                    {
                        key: 'zoom',
                        icon: MagnifyingGlassCircleIcon,
                        label: intl.get('megaAuto.operation.zoom'),
                        checked: visualConfig.zoom,
                        onChange: checked => {
                            megaAutoStore.setVisualConig((cnf) => {
                                cnf.zoom = checked;
                            });
                        },
                    },
                    '-',
                    {
                        key: 'nlg',
                        icon: ChatBubbleLeftEllipsisIcon,
                        label: 'NLG(beta)',
                        checked: nlg,
                        onChange: checked => {
                            megaAutoStore.setVisualConig((cnf) => {
                                cnf.nlg = checked;
                            });
                        },
                        menu: nlg ? {
                            items: [
                                {
                                    key: 'nlg_threshold',
                                    label: "NLG Threshold(beta)",
                                    icon: FunnelIcon,
                                    form: (
                                        <FormContainer>
                                            <Slider
                                                disabled={!nlg}
                                                value={nlgThreshold}
                                                label="NLG Threshold(beta)"
                                                min={0}
                                                max={1}
                                                step={0.01}
                                                valueFormat={(value: number) => `${Math.round(value * 100)}%`}
                                                showValue={true}
                                                onChange={(value: number) => {
                                                    megaAutoStore.setNlgThreshold(value);
                                                }}
                                            />
                                        </FormContainer>
                                    ),
                                },
                            ],
                        } : undefined,
                    },
                ],
            },
            disabled: !viewExists,
        },
    ];

    return <div style={{ position: 'relative', zIndex: 99}}>
        <Toolbar
            items={items}
            styles={{
                root: {
                    margin: '1em 0 0',
                },
            }}
        />
    </div>
}

export default observer(OperationBar);
