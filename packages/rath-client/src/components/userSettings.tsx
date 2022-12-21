import React, { useRef } from 'react';
import intl from 'react-intl-universal';
import styled from 'styled-components';
import { ActionButton, IDropdownOption, IconButton } from '@fluentui/react';
import { LanguageIcon } from '@heroicons/react/24/solid';
import { observer } from 'mobx-react-lite';
import { SUPPORT_LANG } from '../locales';
import { useGlobalStore } from '../store';
import DropdownSelect from './dropDownSelect';

const langOptions: IDropdownOption[] = SUPPORT_LANG.map((lang) => ({
    key: lang.value,
    text: lang.name,
}));

const Container = styled.div<{ navMode: "text" | "icon" }>`
    display: flex;
    flex-direction: column;
    align-items: ${({ navMode }) => navMode === 'text' ? 'stretch' : 'center'};
    > * {
        padding-inline: 10px;
    }
`;
const UserSettings: React.FC = () => {
    const target = useRef<HTMLDivElement>(null);
    const { langStore, commonStore } = useGlobalStore();
    const { navMode } = commonStore;
    return (
        <Container navMode={navMode}>
            {navMode === 'text' && (
                <DropdownSelect
                    border
                    value={langStore.lang}
                    onChange={(e) => {
                        langStore.changeLocalesAndReload(e.target.value);
                    }}
                    icon={<LanguageIcon style={{ margin: '0 0.5em' }} />}
                >
                    {langOptions.map((lang) => (
                        <option key={lang.key} value={lang.key}>
                            {lang.text}
                        </option>
                    ))}
                </DropdownSelect>
            )}
            <div ref={target}>
                <ActionButton
                    text={commonStore.navMode === 'text' ? intl.get('preference.title') : undefined}
                    style={commonStore.navMode === 'text' ? undefined : { display: 'inline-flex', alignItems: 'center' }}
                    iconProps={{ iconName: 'PlayerSettings' }}
                    disabled
                />
            </div>
            <div
                style={{ display: 'flex', justifyContent: 'flex-end', cursor: 'pointer' }}
                onClick={() => {
                    commonStore.setNavMode(navMode === 'icon' ? 'text' : 'icon');
                }}
            >
                <IconButton>
                    <i
                        className={`ms-Icon ms-Icon--${
                            navMode === 'icon' ? 'DecreaseIndentMirrored' : 'DecreaseIndent'
                        }`}
                        aria-hidden="true"
                    />
                </IconButton>
            </div>
        </Container>
    );
};

export default observer(UserSettings);
