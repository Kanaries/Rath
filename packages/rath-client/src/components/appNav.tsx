import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { observer } from 'mobx-react-lite';
import intl from 'react-intl-universal';
import styled from 'styled-components';

import { PIVOT_KEYS } from '../constants';
import { useGlobalStore } from '../store';
import LoginInfo from '../pages/loginInfo';
import useHotKey from '../hooks/use-hotkey';
import { cn } from '../utils/cn';
import { RathIcon } from './icons';
import UserSetting from './userSettings';

const NavContainer = styled.div`
    height: 100vh;
    overflow: hidden auto;
    /* display: relative; */
    position: relative;
    /* flex-direction: vertical; */
    display: flex;
    flex-direction: column;
    border-right: 1px solid #e9ebf0;
    .nav-footer {
        /* position: absolute; */
        bottom: 0px;
        flex-grow: 0;
        flex-shrink: 0;
        overflow: hidden;
        > .padded {
            padding: 1em;
        }
    }
    .text-red {
        color: #e94726;
    }
    .text-yellow {
        color: rgb(237, 167, 15);
    }
    .text-gray {
        color: rgb(103, 109, 108);
    }
`;

const LogoBar = styled.div`
    display: flex;
    padding: 12px;
    align-items: center;
    h1 {
        margin-left: 12px;
        font-size: 1.6em;
    }
    a {
        display: flex;
    }
    img {
        height: auto;
    }
`;

const IconMap = {
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
} as {
    [key: string]: string;
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

function getIcon(k: string): string {
    return IconMap[k] || 'Settings';
}

interface AppNavLink {
    key: string;
    name: string;
    ariaLabel?: string;
    url?: string;
    target?: string;
    icon?: string;
    links?: AppNavLink[];
    isExpanded?: boolean;
    onClick?: (event: React.MouseEvent<HTMLElement>) => void;
}

interface AppNavProps {}
const AppNav: React.FC<AppNavProps> = (props) => {
    const { commonStore } = useGlobalStore();

    const { appKey, navMode } = commonStore;

    const [altKeyPressed, setAltKeyPressed] = useState(false);
    const [expandedGroups, setExpandedGroups] = useState<Record<'eda' | 'dev-mode', boolean>>({
        eda: true,
        'dev-mode': false,
    });

    const toggleGroup = useCallback((key: 'eda' | 'dev-mode') => {
        setExpandedGroups((current) => ({
            ...current,
            [key]: !current[key],
        }));
    }, []);

    const getLinks = useCallback(
        (pivotKeys: string[]): AppNavLink[] => {
            return pivotKeys.map((p) => {
                const hotkeyAccess = altKeyPressed ? Object.entries(HotKeyMap).find(([, key]) => key === p)?.[0] ?? null : null;
                return {
                    url: `#${p}`,
                    key: p,
                    name: `${navMode === 'text' ? intl.get(`menu.${p}`) : ''}${hotkeyAccess ? ` (${hotkeyAccess})` : ''}`,
                    ariaLabel: intl.get(`menu.${p}`),
                    icon: getIcon(p),
                    onClick(e: any) {
                        e.preventDefault();
                        commonStore.setAppKey(p);
                    },
                };
            });
        },
        [commonStore, navMode, altKeyPressed]
    );

    useEffect(() => {
        const handleKeyDown = (ev: KeyboardEvent) => {
            if (ev.key === 'Alt') {
                setAltKeyPressed(true);
            }
        };
        const handleKeyUp = (ev: KeyboardEvent) => {
            if (ev.key === 'Alt' || !ev.altKey) {
                setAltKeyPressed(false);
            }
        };
        document.body.addEventListener('keydown', handleKeyDown);
        document.body.addEventListener('keyup', handleKeyUp);
        return () => {
            document.body.removeEventListener('keydown', handleKeyDown);
            document.body.removeEventListener('keyup', handleKeyUp);
        };
    }, []);

    const HotKeyActions = useMemo(
        () => Object.fromEntries(Object.entries(HotKeyMap).map(([k, appKey]) => [`Alt+${k}`, () => commonStore.setAppKey(appKey)])),
        [commonStore]
    );

    useHotKey(HotKeyActions);

    const links = useMemo<AppNavLink[]>(() => {
        return [
            ...getLinks([PIVOT_KEYS.connection, PIVOT_KEYS.dataSource]),
            {
                url: '#eda',
                key: 'eda',
                name: navMode === 'text' ? intl.get('menu.eda') : '',
                ariaLabel: intl.get('menu.eda'),
                isExpanded: expandedGroups.eda,
                onClick(e) {
                    e.preventDefault();
                    toggleGroup('eda');
                },
                links: getLinks([PIVOT_KEYS.editor, PIVOT_KEYS.semiAuto, PIVOT_KEYS.megaAuto, PIVOT_KEYS.painter]),
            },
            ...getLinks([PIVOT_KEYS.collection, PIVOT_KEYS.dashboard]),
            {
                url: '#dev-mode',
                key: 'dev-mode',
                name: navMode === 'text' ? intl.get('menu.devCollection') : '',
                ariaLabel: intl.get('menu.devCollection'),
                isExpanded: expandedGroups['dev-mode'] || altKeyPressed,
                onClick(e) {
                    e.preventDefault();
                    toggleGroup('dev-mode');
                },
                links: getLinks([
                    // PIVOT_KEYS.noteBook,
                    // PIVOT_KEYS.gallery,
                    // PIVOT_KEYS.explainer,
                    // PIVOT_KEYS.dashBoard,
                    PIVOT_KEYS.causal,
                    PIVOT_KEYS.dashBoardDesigner,
                ]),
            },
            // ...getLinks([PIVOT_KEYS.support]),
            {
                key: 'support',
                name: intl.get('menu.support'),
                url: 'https://docs.kanaries.net',
                target: '_blank',
            },
        ];
    }, [altKeyPressed, expandedGroups, getLinks, navMode, toggleGroup]);

    const renderNavLink = (link: AppNavLink, level = 0): JSX.Element => {
        const active = link.key === appKey;
        const isGroup = Boolean(link.links?.length);
        const accessibleName = link.name || link.ariaLabel || link.key;
        const content = (
            <>
                {navMode === 'icon' && link.icon && <RathIcon name={link.icon} />}
                {navMode === 'text' && <span className="min-w-0 flex-1 truncate">{link.name}</span>}
                {navMode === 'icon' && !link.icon && <span className="truncate text-xs">{link.name}</span>}
                {isGroup && (
                    <RathIcon name="ChevronRight" className={cn('shrink-0 transition-transform', link.isExpanded && 'rotate-90')} aria-hidden />
                )}
            </>
        );
        const className = cn(
            'flex h-8 w-full items-center gap-2 rounded-sm px-3 text-sm transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring',
            navMode === 'icon' ? 'justify-center px-2' : 'justify-start text-left',
            active && 'bg-accent font-medium text-accent-foreground',
            isGroup && 'text-muted-foreground hover:text-foreground',
            level > 0 && navMode === 'text' && 'pl-7'
        );

        return (
            <div key={link.key}>
                {link.target ? (
                    <a href={link.url} target={link.target} rel="noreferrer" className={className} title={accessibleName}>
                        {content}
                    </a>
                ) : (
                    <button
                        type="button"
                        className={className}
                        title={accessibleName}
                        aria-label={accessibleName}
                        aria-current={active ? 'page' : undefined}
                        aria-expanded={isGroup ? link.isExpanded : undefined}
                        onClick={link.onClick}
                    >
                        {content}
                    </button>
                )}
                {link.links && link.isExpanded && (
                    <div role="group" aria-label={accessibleName}>
                        {link.links.map((child) => renderNavLink(child, level + 1))}
                    </div>
                )}
            </div>
        );
    };

    return (
        <NavContainer>
            <LogoBar>
                <a href={`${window.location.protocol}//${window.location.host.split('.').slice(-2).join('.')}/`} target="_blank" rel="noreferrer">
                    <img style={{ width: '38px', marginTop: '4px' }} src="./assets/kanaries-lite.png" alt="rath" />
                </a>
                {navMode === 'text' && (
                    <h1>
                        <span>R</span>
                        <span className="text-red">A</span>
                        <span className="text-yellow">T</span>
                        <span>H</span>
                    </h1>
                )}
            </LogoBar>
            <div style={{ flexGrow: 1, flexShrink: 1 }}>
                <nav aria-label="Main navigation" className="space-y-1 px-2">
                    {links.map((link) => renderNavLink(link))}
                </nav>
            </div>
            <div className="nav-footer">
                <div className="padded">
                    <UserSetting />
                </div>
                <LoginInfo />
            </div>
        </NavContainer>
    );
};

export default observer(AppNav);
