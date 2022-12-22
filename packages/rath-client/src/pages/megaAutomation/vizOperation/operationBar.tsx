import React, { useCallback } from 'react';
import intl from 'react-intl-universal';
import { observer } from 'mobx-react-lite';
import { toJS } from 'mobx';
import {
    AdjustmentsHorizontalIcon, LightBulbIcon, PaintBrushIcon, PencilIcon, PencilSquareIcon, StarIcon, TableCellsIcon
} from '@heroicons/react/24/solid';
import { useGlobalStore } from '../../../store';
import { IVisSpecType } from '../../../interfaces';
import Toolbar from '../../../components/toolbar';
import { ToolbarItemProps } from '../../../components/toolbar/toolbar-item';

interface OperationBarProps {}
const OperationBar: React.FC<OperationBarProps> = props => {
    const { megaAutoStore, commonStore, collectionStore, painterStore, editorStore } = useGlobalStore();
    const { taskMode } = commonStore;
    const { mainViewSpec, mainViewPattern } = megaAutoStore;

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
        },
        {
            key: 'associate',
            icon: LightBulbIcon,
            label: intl.get('megaAuto.commandBar.associate'),
            onClick: () => megaAutoStore.getAssociatedViews(taskMode),
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
    ];

    return <div style={{ position: 'relative', zIndex: 99}}>
        <Toolbar
            items={items}
            styles={{
                root: {
                    margin: '1em 0',
                },
            }}
        />
    </div>
}

export default observer(OperationBar);
