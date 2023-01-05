import React, { useEffect } from 'react';
import { observer } from 'mobx-react-lite';
import {
    ChartBarIcon,
    CommandLineIcon,
    CubeIcon,
    CubeTransparentIcon,
    LightBulbIcon,
    ListBulletIcon,
    QueueListIcon,
    WrenchIcon,
} from '@heroicons/react/24/solid';
import intl from 'react-intl-universal';
import { useGlobalStore } from '../../store';
import { EXPLORE_VIEW_ORDER } from '../../store/megaAutomation';
import Toolbar, { ToolbarItemProps } from '../../components/toolbar';
import { ToolbarSelectButtonItem } from '../../components/toolbar/toolbar-select-button';


const PreferencePanel: React.FC = () => {
    const { megaAutoStore } = useGlobalStore();
    const { visualConfig, vizMode } = megaAutoStore;

    const orderOptions: ToolbarSelectButtonItem['options'] = Object.values(EXPLORE_VIEW_ORDER).map((or) => ({
        key: or,
        label: intl.get(`megaAuto.orderBy.${or}`),
        icon: {
            default: LightBulbIcon,
            field_num: ListBulletIcon,
            cardinality: QueueListIcon,
        }[or],
    }));

    useEffect(() => {
        megaAutoStore.refreshMainViewSpec();
    });

    const items: ToolbarItemProps[] = [
        {
            key: 'viz_sys',
            icon: CommandLineIcon,
            label: intl.get('semiAuto.main.vizsys.title'),
            value: vizMode,
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
                megaAutoStore.setVizMode(key as typeof vizMode);
            },
        },
        {
            key: 'order',
            icon: ChartBarIcon,
            label: intl.get('megaAuto.orderBy.title'),
            options: orderOptions,
            value: megaAutoStore.orderBy,
            onSelect: key => {
                megaAutoStore.setExploreOrder(key);
            },
        },
        '-',
        {
            key: 'debug',
            icon: WrenchIcon,
            label: intl.get('megaAuto.operation.debug'),
            checked: visualConfig.debug,
            onChange: checked => {
                megaAutoStore.setVisualConig((cnf) => {
                    cnf.debug = checked;
                });
            },
        },
    ];

    return (
        <Toolbar
            items={items}
            styles={{
                root: { width: 'max-content' }
            }}
        />
    );
};

export default observer(PreferencePanel);
