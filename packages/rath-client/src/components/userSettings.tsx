import React from 'react';
import styled from 'styled-components';
import { observer } from 'mobx-react-lite';
import { SUPPORT_LANG } from '../locales';
import { useGlobalStore } from '../store';
import { RathIcon } from './icons';
import { Button } from './ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from './ui/dropdown-menu';

const langOptions: Array<{ key: string; text: string }> = SUPPORT_LANG.map((lang) => ({
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
    const navToggleLabel = navMode === 'icon' ? 'Expand navigation' : 'Collapse navigation';
    return (
        <Container style={navMode === 'icon' ? { flexDirection: 'column' } : { flexDirection: 'row', alignItems: 'center' }}>
            {navMode === 'text' && (
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button type="button" variant="ghost" size="icon" title="Language" aria-label="Language">
                            <RathIcon name="LocaleLanguage" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent side="top" align="start">
                        {langOptions.map((item) => (
                            <DropdownMenuItem
                                key={item.key}
                                onSelect={() => {
                                    langStore.changeLocalesAndReload(`${item.key}`);
                                }}
                            >
                                {item.text}
                            </DropdownMenuItem>
                        ))}
                    </DropdownMenuContent>
                </DropdownMenu>
            )}
            <div>
                <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    title={navToggleLabel}
                    aria-label={navToggleLabel}
                    onClick={() => {
                        commonStore.setNavMode(navMode === 'icon' ? 'text' : 'icon');
                    }}
                >
                    <RathIcon name={navMode === 'icon' ? 'DecreaseIndentMirrored' : 'DecreaseIndent'} />
                </Button>
            </div>
        </Container>
    );
};

export default observer(UserSettings);
