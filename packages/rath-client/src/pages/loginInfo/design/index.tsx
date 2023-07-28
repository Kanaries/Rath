import { Dropdown, IDropdownOption, Toggle } from '@fluentui/react';
import { observer } from 'mobx-react-lite';
import intl from 'react-intl-universal';
import type { FC } from 'react';
import { useGlobalStore } from '../../../store';
import VisThemeEditor from './visThemeEditor';

const DesignSegment: FC = () => {
    const { commonStore } = useGlobalStore();
    const { vizTheme, useCustomTheme } = commonStore;
    const { themes } = commonStore;
    const themeOptions: IDropdownOption[] = Object.keys(themes).map<IDropdownOption>(k => {
        return {
            key: k,
            text: k,
        };
    });
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
