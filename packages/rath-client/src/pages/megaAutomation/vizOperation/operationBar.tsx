import React, { useCallback } from 'react';
import intl from 'react-intl-universal';
import { observer } from 'mobx-react-lite';
import { IContextualMenuProps, CommandBar, ICommandBarItemProps } from 'office-ui-fabric-react';

import { useGlobalStore } from '../../../store';

interface OperationBarProps {}
const OperationBar: React.FC<OperationBarProps> = props => {
    const { exploreStore, commonStore, dataSourceStore } = useGlobalStore();
    const { taskMode } = commonStore;
    const { dimFields, meaFields } = dataSourceStore;

    const dimensionOptions: IContextualMenuProps = {
        items: dimFields.map(f => ({
            key: f.fid,
            text: f.name,
            // onClick: () => { exploreStore.addFieldToForkView('dimensions', f.fid) }
            onClick: () => { exploreStore.addField2MainViewPattern(f.fid) }
        }))
    }
    const measureOptions: IContextualMenuProps = {
        items: meaFields.map(f => ({
            key: f.fid,
            text: f.name,
            // onClick: () => { exploreStore.addFieldToForkView('measures', f.fid) }
            onClick: () => { exploreStore.addField2MainViewPattern(f.fid) }
        }))
    }

    const customizeAnalysis = useCallback(() => {
        if (exploreStore.mainViewSpec) {
            commonStore.visualAnalysisInGraphicWalker(exploreStore.mainViewSpec)
        }
    }, [exploreStore, commonStore])

    const analysisInPainter = useCallback(() => {
        if (exploreStore.mainViewSpec) {
            commonStore.analysisInPainter(exploreStore.mainViewSpec)
        }
    }, [commonStore, exploreStore])

    const commandProps: ICommandBarItemProps[] = [
        {
            key: 'dimensions',
            text: intl.get('common.dimension'),
            iconProps: { iconName: 'AddTo' },
            subMenuProps: dimensionOptions,
        },
        {
            key: 'measures',
            text: intl.get('common.measure'),
            iconProps: { iconName: 'AddTo' },
            subMenuProps: measureOptions,
        },
        {
            key: 'editing',
            text: intl.get('lts.commandBar.editing'),
            iconProps: { iconName: 'BarChartVerticalEdit' },
            onClick: customizeAnalysis
        },
        {
            key: 'painting',
            text: intl.get('lts.commandBar.painting'),
            iconProps: { iconName: 'EditCreate' },
            onClick: analysisInPainter
        },
        {
            key: 'associate',
            text: intl.get('lts.commandBar.associate'),
            iconProps: { iconName: 'Lightbulb' },
            onClick: () => {
                exploreStore.getAssociatedViews(taskMode);
            }
        },
        {
            key: 'constraints',
            text: intl.get('lts.commandBar.constraints'),
            iconProps: { iconName: 'MultiSelect' },
            onClick: () => {
                exploreStore.setShowContraints(true);
            }
        }
    ]

    return <div style={{ position: 'relative', zIndex: 99}}>
        <CommandBar items={commandProps} />
    </div>
}

export default observer(OperationBar);
