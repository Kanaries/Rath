import React, { useCallback } from 'react';
import intl from 'react-intl-universal';
import { observer } from 'mobx-react-lite';
import {  CommandBar, ICommandBarItemProps } from '@fluentui/react';
import { toJS } from 'mobx';
import { useGlobalStore } from '../../../store';
import type { IReactVegaHandler } from '../../../components/react-vega';

interface OperationBarProps {
    handler: React.RefObject<IReactVegaHandler>;
}
const OperationBar: React.FC<OperationBarProps> = ({ handler }) => {
    const { megaAutoStore, commonStore, collectionStore, painterStore } = useGlobalStore();
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
    let starIconName = 'FavoriteStar';
    if (viewExists) {
        const viewFields = toJS(mainViewPattern.fields);
        const viewSpec = toJS(mainViewSpec);
        if (collectionStore.collectionContains(viewFields, viewSpec)) {
            starIconName = 'FavoriteStarFill'
        }
    }

    const commandProps: ICommandBarItemProps[] = [
        {
            key: 'editing',
            text: intl.get('megaAuto.commandBar.editing'),
            iconProps: { iconName: 'BarChartVerticalEdit' },
            onClick: customizeAnalysis
        },
        {
            key: 'painting',
            text: intl.get('megaAuto.commandBar.painting'),
            iconProps: { iconName: 'EditCreate' },
            onClick: analysisInPainter
        },
        {
            key: 'associate',
            text: intl.get('megaAuto.commandBar.associate'),
            iconProps: { iconName: 'Lightbulb' },
            onClick: () => {
                megaAutoStore.getAssociatedViews(taskMode);
            }
        },
        {
            key: 'star',
            text: intl.get('common.star'),
            iconProps: { iconName: starIconName },
            onClick: () => {
                if (mainViewPattern && mainViewSpec) {
                    collectionStore.toggleCollectState(toJS(mainViewPattern.fields), toJS(mainViewSpec))
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
            split: true,
            subMenuProps: {
                items: [
                    {
                        key: 'svg',
                        text: 'SVG',
                        onClick: e => {
                            e?.stopPropagation();
                            handler.current?.getSVGData().then(data => {
                                if (data) {
                                    const file = new File([data], 'image.svg');
                                    const url = URL.createObjectURL(file);
                                    const a = document.createElement('a');
                                    a.download = file.name;
                                    a.href = url;
                                    a.click();
                                    requestAnimationFrame(() => {
                                        URL.revokeObjectURL(url);
                                    });
                                }
                            });
                        },
                    },
                ],
            },
            onClick: () => {
                handler.current?.getCanvasData().then(data => {
                    if (data) {
                        const a = document.createElement('a');
                        a.download = 'image.png';
                        a.href = data.replace(/^data:image\/[^;]/, 'data:application/octet-stream');
                        a.click();
                    }
                });
            },
        },
    ]

    return <div style={{ position: 'relative', zIndex: 99}}>
        <CommandBar items={commandProps} />
    </div>
}

export default observer(OperationBar);
