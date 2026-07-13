import React from 'react';
import { observer } from 'mobx-react-lite';

import { SUPPORT_LANG } from '../locales';
import { useGlobalStore } from '../store';
import { RathIcon } from './icons';
import { Monitor, Moon, Sun } from 'lucide-react';
import { useAppearance, type Appearance } from '../appearance';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuRadioGroup,
    DropdownMenuRadioItem,
    DropdownMenuTrigger,
} from './ui/dropdown-menu';
import { SidebarMenu, SidebarMenuButton, SidebarMenuItem, useSidebar } from './ui/sidebar';

const langOptions: Array<{ key: string; text: string }> = SUPPORT_LANG.map((lang) => ({
    key: lang.value,
    text: lang.name,
}));

const UserSettings: React.FC = () => {
    const { langStore } = useGlobalStore();
    const { appearance, resolvedAppearance, setAppearance } = useAppearance();
    const { state, isMobile, openMobile, toggleSidebar } = useSidebar();
    let navToggleLabel = state === 'collapsed' ? 'Expand navigation' : 'Collapse navigation';
    if (isMobile) navToggleLabel = openMobile ? 'Close navigation' : 'Open navigation';

    return (
        <SidebarMenu>
            <SidebarMenuItem>
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <SidebarMenuButton type="button" tooltip="Appearance" aria-label={`Appearance: ${appearance}`}>
                            {resolvedAppearance === 'dark' ? <Moon /> : <Sun />}
                            <span>Appearance</span>
                        </SidebarMenuButton>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="min-w-40" side={state === 'collapsed' ? 'right' : 'top'} align="start">
                        <DropdownMenuRadioGroup value={appearance} onValueChange={(value) => setAppearance(value as Appearance)}>
                            <DropdownMenuRadioItem className="gap-2 py-2 pr-3 text-sm" value="light">
                                <Sun className="h-4 w-4 shrink-0" aria-hidden />
                                <span>Light</span>
                            </DropdownMenuRadioItem>
                            <DropdownMenuRadioItem className="gap-2 py-2 pr-3 text-sm" value="dark">
                                <Moon className="h-4 w-4 shrink-0" aria-hidden />
                                <span>Dark</span>
                            </DropdownMenuRadioItem>
                            <DropdownMenuRadioItem className="gap-2 py-2 pr-3 text-sm" value="system">
                                <Monitor className="h-4 w-4 shrink-0" aria-hidden />
                                <span>System</span>
                            </DropdownMenuRadioItem>
                        </DropdownMenuRadioGroup>
                    </DropdownMenuContent>
                </DropdownMenu>
            </SidebarMenuItem>
            <SidebarMenuItem>
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <SidebarMenuButton type="button" tooltip="Language" aria-label="Language">
                            <RathIcon name="LocaleLanguage" />
                            <span>Language</span>
                        </SidebarMenuButton>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent side={state === 'collapsed' ? 'right' : 'top'} align="start">
                        {langOptions.map((item) => (
                            <DropdownMenuItem
                                key={item.key}
                                onSelect={() => {
                                    langStore.changeLocalesAndReload(item.key);
                                }}
                            >
                                {item.text}
                            </DropdownMenuItem>
                        ))}
                    </DropdownMenuContent>
                </DropdownMenu>
            </SidebarMenuItem>
            <SidebarMenuItem>
                <SidebarMenuButton type="button" tooltip={navToggleLabel} aria-label={navToggleLabel} onClick={toggleSidebar}>
                    <RathIcon name={state === 'collapsed' ? 'DecreaseIndentMirrored' : 'DecreaseIndent'} />
                    <span>{navToggleLabel}</span>
                </SidebarMenuButton>
            </SidebarMenuItem>
        </SidebarMenu>
    );
};

export default observer(UserSettings);
