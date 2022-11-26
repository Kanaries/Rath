import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Nav, INavLinkGroup } from '@fluentui/react';
import { observer } from 'mobx-react-lite';
import intl from 'react-intl-universal';
import styled from 'styled-components';

import { PIVOT_KEYS } from '../constants';
import { useGlobalStore } from '../store';
import useHotKey from '../hooks/use-hotkey';
import UserSetting from './userSettings';

const NavContainer = styled.div`
    height: 100%;
    /* display: relative; */
    position: relative;
    /* flex-direction: vertical; */
    display: flex;
    flex-direction: column;
    .nav-footer {
        /* position: absolute; */
        bottom: 0px;
        /* padding-left: 1em; */
    }
    padding-left: 10px;
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
`;

const IconMap = {
    [PIVOT_KEYS.megaAuto]: 'Robot',
    [PIVOT_KEYS.semiAuto]: 'Manufacturing',
    [PIVOT_KEYS.editor]: 'LineChart',
    [PIVOT_KEYS.support]: 'Telemarketer',
    [PIVOT_KEYS.dataSource]: 'DataManagementSettings',
    [PIVOT_KEYS.painter]: 'Brush',
    [PIVOT_KEYS.dashBoardDesigner]: 'SizeLegacy',
    [PIVOT_KEYS.collection]: 'Heart',
    [PIVOT_KEYS.dashboard]: 'CRMReport',
    [PIVOT_KEYS.causal]: 'Relationship'
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

interface AppNavProps {}
const AppNav: React.FC<AppNavProps> = (props) => {
    const { commonStore } = useGlobalStore();

    const { appKey, navMode } = commonStore;

    const [altKeyPressed, setAltKeyPressed] = useState(false);

    const getLinks = useCallback(
        (pivotKeys: string[]) => {
            return pivotKeys.map((p) => {
                const hotkeyAccess = altKeyPressed ? Object.entries(HotKeyMap).find(
                    ([, key]) => key === p
                )?.[0] ?? null : null;
                return {
                    url: `#${p}`,
                    key: p,
                    name: `${navMode === 'text' ? intl.get(`menu.${p}`) : ''}${
                        hotkeyAccess ? ` (${hotkeyAccess})` : ''
                    }`,
                    forceAnchor: true,
                    iconProps: { iconName: getIcon(p) },
                    // iconProps: navMode === 'icon' ? {iconName: getIcon(p) } : undefined,
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

    const HotKeyActions = useMemo(() => Object.fromEntries(Object.entries(HotKeyMap).map(([k, appKey]) => [
        `Alt+${k}`, () => commonStore.setAppKey(appKey)
    ])), [commonStore]);

    useHotKey(HotKeyActions);

    const groups: INavLinkGroup[] = [
        {
            links: [
                ...getLinks([
                    PIVOT_KEYS.dataSource,
                    PIVOT_KEYS.editor,
                    PIVOT_KEYS.semiAuto,
                    PIVOT_KEYS.megaAuto,
                    PIVOT_KEYS.painter,
                    PIVOT_KEYS.collection,
                    PIVOT_KEYS.dashboard,
                ]),
                {
                    url: '#dev-mode',
                    key: intl.get('menu.devCollection'),
                    name: navMode === 'text' ? intl.get('menu.devCollection') : '',
                    isExpanded: altKeyPressed,
                    forceAnchor: true,
                    onClick(e: any) {
                        e.preventDefault();
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
                ...getLinks([PIVOT_KEYS.support]),
                // ...pivotList.map(item => {
                //     return {
                //         url: `#${item.itemKey}`,
                //         key: item.itemKey,
                //         name: item.title,
                //         forceAnchor: true,
                //         onClick (e: any) {
                //             e.preventDefault();
                //             commonStore.setAppKey(item.itemKey)
                //         }
                //     }
                // })
            ],
        },
    ];

    return (
        <NavContainer>
            <LogoBar>
                <a
                    // onClick={() => { window.location.reload(false); }}
                    href="https://kanaries.cn/"
                >
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
            <div className="flex-1">
                <Nav selectedKey={appKey} groups={groups} />
            </div>
            <div className="nav-footer">
                <UserSetting />
            </div>
        </NavContainer>
    );
};

export default observer(AppNav);
