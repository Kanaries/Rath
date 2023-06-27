import React, { useCallback } from 'react';
import intl from 'react-intl-universal';
import { observer } from 'mobx-react-lite';
import {  CommandBar, ICommandBarItemProps } from '@fluentui/react';
import { toJS } from 'mobx';
import { useGlobalStore } from '../../../store';
import { IVisSpecType } from '../../../interfaces';
import type { IReactVegaHandler } from '../../../components/react-vega';
import { PIVOT_KEYS } from '../../../constants';

interface OperationBarProps {
    handler: React.RefObject<IReactVegaHandler>;
}
const OperationBar: React.FC<OperationBarProps> = ({ handler }) => {
    const { megaAutoStore, commonStore, collectionStore, painterStore, editorStore, semiAutoStore } = useGlobalStore();
    const { mainView } = megaAutoStore;

    const customizeAnalysis = useCallback(() => {
        if (mainView.spec) {
            commonStore.visualAnalysisInGraphicWalker(mainView.spec)
        }
    }, [mainView.spec, commonStore])

    const analysisInPainter = useCallback(() => {
        if (mainView.spec && mainView.dataViewQuery) {
            painterStore.analysisInPainter(mainView.spec, mainView.dataViewQuery)
        }
    }, [mainView.spec, mainView.dataViewQuery, painterStore])

    let starIconName = 'FavoriteStar';
    if (mainView.dataViewQuery && mainView.spec) {
        const viewFields = toJS(mainView.dataViewQuery.fields);
        const viewSpec = toJS(mainView.spec);
        if (collectionStore.collectionContains(viewFields, viewSpec, IVisSpecType.vegaSubset)) {
            starIconName = 'FavoriteStarFill'
        }
    }

    const commandProps: ICommandBarItemProps[] = [
        {
            key: 'editing',
            text: intl.get('megaAuto.commandBar.editing'),
            iconProps: { iconName: 'BarChartVerticalEdit' },
            subMenuProps: {
                items: [
                    {
                        key: 'editingInGW',
                        text: intl.get('megaAuto.commandBar.editInGW'),
                        iconProps: { iconName: 'BarChartVerticalEdit' },
                        onClick: customizeAnalysis,
                    },
                    {
                        key: 'editingInEditor',
                        text: intl.get('megaAuto.commandBar.editInEditor'),
                        iconProps: { iconName: 'Edit' },
                        onClick: () => {
                            if (mainView.dataViewQuery && mainView.spec) {
                                editorStore.syncSpec(IVisSpecType.vegaSubset, mainView.spec)
                                megaAutoStore.changeMainViewSpecSource()
                            }
                        }
                    }

                ]
            }
        },
        {
            key: 'painting',
            text: intl.get('megaAuto.commandBar.painting'),
            iconProps: { iconName: 'EditCreate' },
            onClick: analysisInPainter
        },
        // {
        //     key: 'associate',
        //     text: intl.get('megaAuto.commandBar.associate'),
        //     iconProps: { iconName: 'Lightbulb' },
        //     onClick: () => {
        //         megaAutoStore.getAssociatedViews(taskMode);
        //     }
        // },
        {
            key: 'analysisInSemi',
            text: intl.get('megaAuto.commandBar.associate'),
            iconProps: { iconName: 'Lightbulb' },
            onClick: () => {
                if (mainView.dataViewQuery !== null) {
                    semiAutoStore.analysisInCopilot(toJS(mainView.dataViewQuery))
                    commonStore.setAppKey(PIVOT_KEYS.semiAuto);
                }
            }
        },
        {
            key: 'star',
            text: intl.get('common.star'),
            iconProps: { iconName: starIconName },
            onClick: () => {
                if (mainView.dataViewQuery && mainView.spec) {
                    collectionStore.toggleCollectState(toJS(mainView.dataViewQuery.fields), toJS(mainView.spec), IVisSpecType.vegaSubset)
                }
            }
        },
        {
            key: 'constraints',
            text: intl.get('megaAuto.commandBar.constraints'),
            iconProps: { iconName: 'MultiSelect' },
            onClick: () => {
                megaAutoStore.setShowContraints(true);
            },
            disabled: true
        },
        {
            key: 'download',
            text: intl.get('megaAuto.commandBar.download'),
            iconProps: { iconName: 'Download' },
            onClick: () => {
                handler.current?.exportImage();
            },
        },
    ]

    return <div style={{ position: 'relative', zIndex: 99}}>
        <CommandBar items={commandProps} />
    </div>
}

export default observer(OperationBar);
