import React, { useCallback } from 'react';
import intl from 'react-intl-universal';
import { observer } from 'mobx-react-lite';
import { IContextualMenuProps, CommandBar, ICommandBarItemProps } from '@fluentui/react';

import { useGlobalStore } from '../../../store';

interface OperationBarProps {}
const OperationBar: React.FC<OperationBarProps> = props => {
    const { megaAutoStore, commonStore, dataSourceStore } = useGlobalStore();
    const { taskMode } = commonStore;
    const { dimFields, meaFields } = dataSourceStore;

    const dimensionOptions: IContextualMenuProps = {
        items: dimFields.map(f => ({
            key: f.fid,
            text: f.name,
            // onClick: () => { megaAutoStore.addFieldToForkView('dimensions', f.fid) }
            onClick: () => { megaAutoStore.addField2MainViewPattern(f.fid) }
        }))
    }
    const measureOptions: IContextualMenuProps = {
        items: meaFields.map(f => ({
            key: f.fid,
            text: f.name,
            // onClick: () => { megaAutoStore.addFieldToForkView('measures', f.fid) }
            onClick: () => { megaAutoStore.addField2MainViewPattern(f.fid) }
        }))
    }

    const customizeAnalysis = useCallback(() => {
        if (megaAutoStore.mainViewSpec) {
            commonStore.visualAnalysisInGraphicWalker(megaAutoStore.mainViewSpec)
        }
    }, [megaAutoStore, commonStore])

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
            key: 'associate',
            text: intl.get('lts.commandBar.associate'),
            iconProps: { iconName: 'Lightbulb' },
            onClick: () => {
                megaAutoStore.getAssociatedViews(taskMode);
            }
        },
        {
            key: 'constraints',
            text: intl.get('lts.commandBar.constraints'),
            iconProps: { iconName: 'MultiSelect' },
            onClick: () => {
                megaAutoStore.setShowContraints(true);
            }
        }
    ]

    return <div style={{ position: 'relative', zIndex: 99}}>
        <CommandBar items={commandProps} />
    </div>
}

export default observer(OperationBar);
