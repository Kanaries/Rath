import React, { useCallback } from 'react';
import { Nav, INavLinkGroup } from 'office-ui-fabric-react';
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

interface AppNavProps {}
const AppNav: React.FC<AppNavProps> = props => {
    const { commonStore } = useGlobalStore()

    const { appKey } = commonStore;

    const getLinks = useCallback((pivotKeys: string[]) => {
        return pivotKeys.map(p => {
            return {
                url: `#${p}`,
                key: p,
                name: intl.get(`menu.${p}`),
                forceAnchor: true,
                onClick (e: any) {
                    e.preventDefault();
                    commonStore.setAppKey(p)
                }
            }
        })
    }, [commonStore])

    const groups: INavLinkGroup[] = [
        {
            links: [
                ...getLinks([PIVOT_KEYS.dataSource,
                    PIVOT_KEYS.lts,
                    PIVOT_KEYS.editor,
                    PIVOT_KEYS.pattern,
                ]),
                {
                    url: '#dev-mode',
                    key: intl.get('menu.devCollection'),
                    name: intl.get('menu.devCollection'),
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
                    name: intl.get('common.home')
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
            <h1>RATH</h1>
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
