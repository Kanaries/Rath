import { Dropdown, IDropdownOption, Toggle } from '@fluentui/react';
import { observer } from 'mobx-react-lite';
import intl from 'react-intl-universal';
import { FC } from 'react';
import { THEME_KEYS } from '../../../queries/themes';
import { useGlobalStore } from '../../../store';
import VisThemeEditor from './visThemeEditor';

const themeOptions: IDropdownOption[] = [
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
    const { commonStore } = useGlobalStore();
    const { vizTheme, useCustomTheme } = commonStore;
    return (
        <div>
            <Dropdown
                options={themeOptions}
                label={intl.get('common.vistheme')}
                selectedKey={vizTheme}
                onChange={(e, op) => {
                    op && commonStore.applyPreBuildTheme(op.key as string);
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
