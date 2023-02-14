import { Dropdown, IDropdownOption, SelectableOptionMenuItemType, Toggle } from '@fluentui/react';
import { observer } from 'mobx-react-lite';
import intl from 'react-intl-universal';
import { FC, useEffect, useMemo, useState } from 'react';
import { THEME_KEYS } from '../../../queries/themes';
import { useGlobalStore } from '../../../store';
import type { IThemeInfo } from '../../../store/commonStore';
import VisThemeEditor from './visThemeEditor';

const builtInThemeOptions: IDropdownOption[] = [
    { key: THEME_KEYS.default, text: 'Default' },
    { key: THEME_KEYS.googlecharts, text: 'Google Charts' },
    { key: THEME_KEYS.powerbi, text: 'PowerBI' },
    { key: THEME_KEYS.latimes, text: 'latimes' },
    { key: THEME_KEYS.excel, text: 'excel' },
    { key: THEME_KEYS.fivethreeeight, text: '538' },
    { key: THEME_KEYS.ggplot2, text: 'GGPlot2' },
    { key: THEME_KEYS.vox, text: 'Vox' },
];

const DesignSegment: FC = () => {
    const { commonStore, userStore } = useGlobalStore();
    const { vizTheme, useCustomTheme } = commonStore;
    const { userName } = userStore;
    const [cloudThemes, setCloudThemes] = useState<IThemeInfo[]>([]);
    useEffect(() => {
        if (userName) {
            commonStore.getCloudThemes().then(list => {
                setCloudThemes(list);
            });
        }
    }, [userName, commonStore]);
    const options = useMemo<IDropdownOption[]>(() => [
        ...cloudThemes.map<IDropdownOption>(thm => ({
            key: thm.id,
            text: thm.name,
            data: thm.config,
        })),
        { key: 'divider', text: '-', itemType: SelectableOptionMenuItemType.Divider },
        ...builtInThemeOptions,
    ], [cloudThemes]);
    return (
        <div>
            <Dropdown
                options={options}
                label={intl.get('common.vistheme')}
                selectedKey={vizTheme}
                onChange={(e, op) => {
                    if (op) {
                        if (op.data) {
                            commonStore.applyLoadedTheme(op.key as string, op.data);
                        } else {
                            commonStore.applyPreBuildTheme(op.key as string);
                        }
                    }
                }}
            />
            <div>
                <Toggle
                    label={intl.get('login.design.useCustomTheme')}
                    checked={useCustomTheme}
                    onChange={(e, checked) => {
                        commonStore.setUseCustomeTheme(Boolean(checked));
                    }}
                />
            </div>
            {
                useCustomTheme && <VisThemeEditor />
            }
        </div>
    );
};

export default observer(DesignSegment);
