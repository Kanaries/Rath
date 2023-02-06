import React from 'react';
import styled from 'styled-components';
import { DirectionalHint, IContextualMenuProps, IDropdownOption, IconButton } from '@fluentui/react';
import { observer } from 'mobx-react-lite';
import { SUPPORT_LANG } from '../locales';
import { useGlobalStore } from '../store';

const langOptions: IDropdownOption[] = SUPPORT_LANG.map((lang) => ({
    key: lang.value,
    text: lang.name,
}));

const Container = styled.div`
    display: flex;
    flex-wrap: wrap;
`;
const UserSettings: React.FC = () => {
    // const target = useRef<HTMLDivElement>(null);
    const { langStore, commonStore } = useGlobalStore();
    const { navMode } = commonStore;
    const menuProps: IContextualMenuProps = {
        directionalHint: DirectionalHint.topAutoEdge,
        items: langOptions.map((item) => ({
            key: `${item.key}`,
            text: item.text,
            onClick: () => {
                langStore.changeLocalesAndReload(`${item.key}`);
            },
        })),

        directionalHintFixed: true,
    };
    return (
        <Container style={navMode === 'icon' ? { flexDirection: 'column' } : { flexDirection: 'row', alignItems: 'center' }}>
            {navMode === 'text' && (
                <IconButton menuProps={menuProps} iconProps={{ iconName: 'LocaleLanguage' }} title="Language" ariaLabel="Language" />
            )}
            {/* <div ref={target}>
                <ActionButton
                    text={commonStore.navMode === 'text' ? intl.get('preference.title') : ''}
                    iconProps={{ iconName: 'PlayerSettings' }}
                    disabled
                ></ActionButton>
            </div> */}
            <div>
                <IconButton
                    onClick={() => {
                        commonStore.setNavMode(navMode === 'icon' ? 'text' : 'icon');
                    }}
                >
                    <i className={`ms-Icon ms-Icon--${navMode === 'icon' ? 'DecreaseIndentMirrored' : 'DecreaseIndent'}`} aria-hidden="true"></i>
                </IconButton>
            </div>
        </Container>
    );
};

export default observer(UserSettings);
