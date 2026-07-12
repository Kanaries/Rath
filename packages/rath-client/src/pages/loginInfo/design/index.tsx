import { observer } from 'mobx-react-lite';
import intl from 'react-intl-universal';
import type { FC } from 'react';
import { useGlobalStore } from '../../../store';
import { RathSelect, RathSelectOption } from '../../../components/rath-ui/rath-select';
import { Label } from '../../../components/ui/label';
import { Switch } from '../../../components/ui/switch';
import VisThemeEditor from './visThemeEditor';

const DesignSegment: FC = () => {
    const { commonStore } = useGlobalStore();
    const { vizTheme, useCustomTheme } = commonStore;
    const { themes } = commonStore;
    const themeOptions: RathSelectOption[] = Object.keys(themes).map<RathSelectOption>((k) => {
        return {
            key: k,
            text: k,
        };
    });
    return (
        <div>
            <RathSelect
                options={themeOptions}
                label={intl.get('common.vistheme')}
                selectedKey={vizTheme}
                onChange={(key) => {
                    commonStore.applyPreBuildTheme(key as string);
                }}
            />
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 12 }}>
                <Switch
                    id="login-design-use-custom-theme"
                    checked={useCustomTheme}
                    onCheckedChange={(checked) => {
                        commonStore.setUseCustomeTheme(Boolean(checked));
                    }}
                />
                <Label htmlFor="login-design-use-custom-theme">{intl.get('login.design.useCustomTheme')}</Label>
            </div>
            {useCustomTheme && <VisThemeEditor />}
        </div>
    );
};

export default observer(DesignSegment);
