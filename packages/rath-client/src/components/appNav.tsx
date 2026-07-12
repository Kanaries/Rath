import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { observer } from 'mobx-react-lite';
import intl from 'react-intl-universal';

import { PIVOT_KEYS } from '../constants';
import { useGlobalStore } from '../store';
import LoginInfo from '../pages/loginInfo';
import useHotKey from '../hooks/use-hotkey';
import { cn } from '../utils/cn';
import { RathIcon } from './icons';
import UserSetting from './userSettings';
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarGroup,
    SidebarGroupContent,
    SidebarGroupLabel,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    SidebarRail,
    useSidebar,
} from './ui/sidebar';

const IconMap: Record<string, string> = {
    [PIVOT_KEYS.megaAuto]: 'UserEvent',
    [PIVOT_KEYS.semiAuto]: 'D365TalentInsight',
    [PIVOT_KEYS.editor]: 'LineChart',
    [PIVOT_KEYS.support]: 'Telemarketer',
    [PIVOT_KEYS.dataSource]: 'DataManagementSettings',
    [PIVOT_KEYS.painter]: 'Brush',
    [PIVOT_KEYS.dashBoardDesigner]: 'SizeLegacy',
    [PIVOT_KEYS.collection]: 'FavoriteStar',
    [PIVOT_KEYS.dashboard]: 'Presentation',
    [PIVOT_KEYS.causal]: 'Relationship',
    [PIVOT_KEYS.connection]: 'Database',
};

const HotKeyMap = {
    D: PIVOT_KEYS.dataSource,
    M: PIVOT_KEYS.editor,
    S: PIVOT_KEYS.semiAuto,
    A: PIVOT_KEYS.megaAuto,
    P: PIVOT_KEYS.painter,
    L: PIVOT_KEYS.collection,
    B: PIVOT_KEYS.dashboard,
    C: PIVOT_KEYS.causal,
} as const;

interface AppNavLink {
    key: string;
    name: string;
    ariaLabel?: string;
    url?: string;
    target?: string;
    icon: string;
    onClick?: (event: React.MouseEvent<HTMLElement>) => void;
}

type ExpandableGroupKey = 'eda' | 'dev-mode';

interface AppNavGroup {
    key: ExpandableGroupKey;
    name: string;
    isExpanded: boolean;
    links: AppNavLink[];
}

const AppNav: React.FC = () => {
    const { commonStore } = useGlobalStore();
    const { appKey } = commonStore;
    const { state, isMobile, setOpenMobile } = useSidebar();
    const [altKeyPressed, setAltKeyPressed] = useState(false);
    const [expandedGroups, setExpandedGroups] = useState<Record<ExpandableGroupKey, boolean>>({
        eda: true,
        'dev-mode': false,
    });

    const toggleGroup = useCallback((key: ExpandableGroupKey) => {
        setExpandedGroups((current) => ({ ...current, [key]: !current[key] }));
    }, []);

    const getLinks = useCallback(
        (pivotKeys: string[]): AppNavLink[] =>
            pivotKeys.map((pivotKey) => {
                const hotkeyAccess = altKeyPressed ? Object.entries(HotKeyMap).find(([, key]) => key === pivotKey)?.[0] ?? null : null;
                const label = intl.get(`menu.${pivotKey}`);
                return {
                    url: `#${pivotKey}`,
                    key: pivotKey,
                    name: `${label}${hotkeyAccess ? ` (${hotkeyAccess})` : ''}`,
                    ariaLabel: label,
                    icon: IconMap[pivotKey] || 'Settings',
                    onClick(event) {
                        event.preventDefault();
                        commonStore.setAppKey(pivotKey);
                    },
                };
            }),
        [altKeyPressed, commonStore]
    );

    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Alt') setAltKeyPressed(true);
        };
        const handleKeyUp = (event: KeyboardEvent) => {
            if (event.key === 'Alt' || !event.altKey) setAltKeyPressed(false);
        };
        window.addEventListener('keydown', handleKeyDown);
        window.addEventListener('keyup', handleKeyUp);
        return () => {
            window.removeEventListener('keydown', handleKeyDown);
            window.removeEventListener('keyup', handleKeyUp);
        };
    }, []);

    const hotKeyActions = useMemo(
        () => Object.fromEntries(Object.entries(HotKeyMap).map(([key, pivotKey]) => [`Alt+${key}`, () => commonStore.setAppKey(pivotKey)])),
        [commonStore]
    );
    useHotKey(hotKeyActions);

    const navigation = useMemo(
        () => ({
            data: getLinks([PIVOT_KEYS.connection, PIVOT_KEYS.dataSource]),
            exploration: {
                key: 'eda' as const,
                name: intl.get('menu.eda'),
                isExpanded: expandedGroups.eda,
                links: getLinks([PIVOT_KEYS.editor, PIVOT_KEYS.semiAuto, PIVOT_KEYS.megaAuto, PIVOT_KEYS.painter]),
            },
            library: getLinks([PIVOT_KEYS.collection, PIVOT_KEYS.dashboard, PIVOT_KEYS.causal]),
            insiders: {
                key: 'dev-mode' as const,
                name: intl.get('menu.devCollection'),
                isExpanded: expandedGroups['dev-mode'] || altKeyPressed,
                links: getLinks([PIVOT_KEYS.dashBoardDesigner]),
            },
            support: [
                {
                    key: PIVOT_KEYS.support,
                    name: intl.get('menu.support'),
                    ariaLabel: intl.get('menu.support'),
                    url: 'https://docs.kanaries.net',
                    target: '_blank',
                    icon: IconMap[PIVOT_KEYS.support],
                },
            ] as AppNavLink[],
        }),
        [altKeyPressed, expandedGroups, getLinks]
    );

    const handleNavigation = useCallback(
        (link: AppNavLink, event: React.MouseEvent<HTMLElement>) => {
            link.onClick?.(event);
            if (isMobile) setOpenMobile(false);
        },
        [isMobile, setOpenMobile]
    );

    const renderMenu = (links: AppNavLink[]) => (
        <SidebarMenu>
            {links.map((link) => {
                const active = link.key === appKey;
                const accessibleName = link.ariaLabel || link.name;
                const content = (
                    <>
                        <RathIcon name={link.icon} />
                        <span>{link.name}</span>
                    </>
                );
                return (
                    <SidebarMenuItem key={link.key}>
                        {link.target ? (
                            <SidebarMenuButton asChild isActive={active} tooltip={accessibleName}>
                                <a
                                    href={link.url}
                                    target={link.target}
                                    rel="noreferrer"
                                    aria-label={accessibleName}
                                    onClick={(event) => handleNavigation(link, event)}
                                >
                                    {content}
                                </a>
                            </SidebarMenuButton>
                        ) : (
                            <SidebarMenuButton
                                type="button"
                                isActive={active}
                                tooltip={accessibleName}
                                aria-label={accessibleName}
                                aria-current={active ? 'page' : undefined}
                                onClick={(event) => handleNavigation(link, event)}
                            >
                                {content}
                            </SidebarMenuButton>
                        )}
                    </SidebarMenuItem>
                );
            })}
        </SidebarMenu>
    );

    const renderExpandableGroup = (group: AppNavGroup) => {
        const isIconCollapsed = state === 'collapsed' && !isMobile;
        const showLinks = isIconCollapsed || group.isExpanded;
        return (
            <SidebarGroup key={group.key}>
                {!isIconCollapsed && (
                    <SidebarGroupLabel asChild>
                        <button
                            type="button"
                            className="w-full cursor-pointer justify-between text-left"
                            aria-label={group.name}
                            aria-expanded={group.isExpanded}
                            onClick={() => toggleGroup(group.key)}
                        >
                            <span className="truncate">{group.name}</span>
                            <RathIcon
                                name="ChevronRight"
                                className={cn('transition-transform duration-200', group.isExpanded && 'rotate-90')}
                                aria-hidden
                            />
                        </button>
                    </SidebarGroupLabel>
                )}
                {showLinks && <SidebarGroupContent>{renderMenu(group.links)}</SidebarGroupContent>}
            </SidebarGroup>
        );
    };

    const isLocalHost =
        window.location.hostname === 'localhost' ||
        /^\d{1,3}(\.\d{1,3}){3}$/.test(window.location.hostname) ||
        window.location.hostname.includes(':');
    const appHome = isLocalHost
        ? `${window.location.origin}/`
        : `${window.location.protocol}//${window.location.host.split('.').slice(-2).join('.')}/`;

    return (
        <Sidebar collapsible="icon">
            <SidebarHeader>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton asChild size="lg" tooltip="RATH" className="h-12">
                            <a href={appHome} target="_blank" rel="noreferrer" aria-label="RATH home">
                                <img className="h-8 w-8 shrink-0 object-contain" src="./assets/kanaries-lite.png" alt="" />
                                <span className="flex items-baseline text-xl font-normal tracking-wide">
                                    <span>R</span>
                                    <span className="text-[#e94726]">A</span>
                                    <span className="text-[#eda70f]">T</span>
                                    <span>H</span>
                                </span>
                            </a>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarHeader>
            <SidebarContent>
                <SidebarGroup>
                    <SidebarGroupContent>{renderMenu(navigation.data)}</SidebarGroupContent>
                </SidebarGroup>
                {renderExpandableGroup(navigation.exploration)}
                <SidebarGroup>
                    <SidebarGroupContent>{renderMenu(navigation.library)}</SidebarGroupContent>
                </SidebarGroup>
                {renderExpandableGroup(navigation.insiders)}
                <SidebarGroup className="mt-auto">
                    <SidebarGroupContent>{renderMenu(navigation.support)}</SidebarGroupContent>
                </SidebarGroup>
            </SidebarContent>
            <SidebarFooter>
                <UserSetting />
                <LoginInfo />
            </SidebarFooter>
            <SidebarRail />
        </Sidebar>
    );
};

export default observer(AppNav);
