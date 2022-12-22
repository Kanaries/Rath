import React, { useCallback } from 'react';
import intl from 'react-intl-universal';
import { observer } from 'mobx-react-lite';
import { toJS } from 'mobx';
import {
    AdjustmentsHorizontalIcon, Cog8ToothIcon, LightBulbIcon, MagnifyingGlassCircleIcon, PaintBrushIcon, PencilIcon, PencilSquareIcon, StarIcon, TableCellsIcon, ViewfinderCircleIcon
} from '@heroicons/react/24/solid';
import { useGlobalStore } from '../../../store';
import { IVisSpecType } from '../../../interfaces';
import Toolbar from '../../../components/toolbar';
import { ToolbarItemProps } from '../../../components/toolbar/toolbar-item';

interface OperationBarProps {}
const OperationBar: React.FC<OperationBarProps> = props => {
    const { megaAutoStore, commonStore, collectionStore, painterStore, editorStore } = useGlobalStore();
    const { taskMode } = commonStore;
    const { mainViewSpec, mainViewPattern, visualConfig } = megaAutoStore;

    const customizeAnalysis = useCallback(() => {
        if (mainViewSpec) {
            commonStore.visualAnalysisInGraphicWalker(mainViewSpec)
        }
    }, [mainViewSpec, commonStore])

    const analysisInPainter = useCallback(() => {
        if (mainViewSpec && mainViewPattern) {
            painterStore.analysisInPainter(mainViewSpec, mainViewPattern)
        }
    }, [mainViewSpec, mainViewPattern, painterStore])

    const viewExists = !(mainViewPattern === null || mainViewSpec === null);
    const starred = viewExists && (() => {
        const viewFields = toJS(mainViewPattern.fields);
        const viewSpec = toJS(mainViewSpec);
        return collectionStore.collectionContains(viewFields, viewSpec, IVisSpecType.vegaSubset);
    })();

    const items: ToolbarItemProps[] = [
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
