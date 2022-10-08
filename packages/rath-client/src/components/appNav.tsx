import React, { useCallback } from 'react';
import { Nav, INavLinkGroup } from '@fluentui/react';
import { observer } from 'mobx-react-lite'
import intl from 'react-intl-universal';
import styled from 'styled-components';

import { PIVOT_KEYS } from '../constants';
import { useGlobalStore } from '../store';
import UserSetting from './userSettings'

const NavContainer = styled.div`
    height: 100%;
    /* display: relative; */
    position: relative;
    /* flex-direction: vertical; */
    .nav-footer{
        position: absolute;
        bottom: 12px;
        padding: 1em;
    }
    padding-left: 10px;
    .text-red{
        color: #e94726
    }
    .text-yellow{
        color: rgb(237, 167, 15)
    }
    .text-gray{
        color: rgb(103, 109, 108)
    }
`

const LogoBar = styled.div`
    display: flex;
    padding: 12px;
    align-items: center;
    h1 {
        margin-left: 12px;
        font-size: 1.6em;
    }
`

const IconMap = {
    [PIVOT_KEYS.lts]: 'Robot',
    [PIVOT_KEYS.pattern]: 'Manufacturing',
    [PIVOT_KEYS.editor]: 'LineChart',
    [PIVOT_KEYS.support]: 'Telemarketer',
    [PIVOT_KEYS.dataSource]: 'DataManagementSettings',
    [PIVOT_KEYS.noteBook]: 'Game',
    [PIVOT_KEYS.dashBoard]: 'ViewDashboard',
    [PIVOT_KEYS.gallery]: 'ReadingMode',
    [PIVOT_KEYS.explainer]: 'SiteScan',
    [PIVOT_KEYS.painter]: 'Brush',
    [PIVOT_KEYS.progressiveDashBoard]: 'SizeLegacy'
} as {
    [key: string]: string
}

function getIcon (k: string): string {
    return IconMap[k] || 'Settings'
}

interface AppNavProps {}
const AppNav: React.FC<AppNavProps> = props => {
    const { commonStore } = useGlobalStore()

    const { appKey, navMode } = commonStore;

    const getLinks = useCallback((pivotKeys: string[]) => {
        return pivotKeys.map(p => {
            return {
                url: `#${p}`,
                key: p,
                name: navMode === 'text' ? intl.get(`menu.${p}`) : '',
                forceAnchor: true,
                iconProps: {iconName: getIcon(p) },
                // iconProps: navMode === 'icon' ? {iconName: getIcon(p) } : undefined,
                onClick (e: any) {
                    e.preventDefault();
                    commonStore.setAppKey(p)
                }
            }
        })
    }, [commonStore, navMode])

    const groups: INavLinkGroup[] = [
        {
            links: [
                ...getLinks([PIVOT_KEYS.dataSource,
                    PIVOT_KEYS.lts,
                    PIVOT_KEYS.editor,
                    PIVOT_KEYS.pattern,
                    PIVOT_KEYS.painter,
                    PIVOT_KEYS.progressiveDashBoard
                ]),
                {
                    url: '#dev-mode',
                    key: intl.get('menu.devCollection'),
                    name: navMode === 'text' ? intl.get('menu.devCollection') : '',
                    isExpanded: false,
                    forceAnchor: true,
                    onClick (e: any) { e.preventDefault() },
                    links: getLinks([
                        PIVOT_KEYS.noteBook,
                        PIVOT_KEYS.gallery,
                        PIVOT_KEYS.explainer,
                        PIVOT_KEYS.dashBoard,
                    ])
                },
                {
                    url: '/',
                    name: navMode === 'text' ? intl.get('common.home') : '',
                    // iconProps: navMode === 'icon' ? {iconName: 'Home'} : undefined,
                    iconProps: {iconName: 'Home'}
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
            ]
        }
    ]
    return <NavContainer>
        <LogoBar>
            <a
                // onClick={() => { window.location.reload(false); }}
                href="https://kanaries.cn/"
            >
                <img
                    style={{ width: '38px', marginTop: '4px' }}
                    src="./assets/kanaries-lite.png"
                    alt="rath"
                />
            </a>
            {navMode === 'text' && <h1><span>R</span><span className='text-red'>A</span><span className='text-yellow'>T</span><span>H</span></h1>}
        </LogoBar>
        <Nav
            selectedKey={appKey}
            groups={groups}
        />
        <div className="nav-footer">
            <UserSetting />
        </div>
    </NavContainer>
}

export default observer(AppNav);
