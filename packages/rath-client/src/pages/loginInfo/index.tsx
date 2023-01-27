import { FC, useMemo, useState } from 'react';
import intl from 'react-intl-universal';
import { observer } from 'mobx-react-lite';
import { Dialog, INavLinkGroup, Nav } from '@fluentui/react';
import styled from 'styled-components';
import { useGlobalStore } from '../../store';
import Account from './account';
import Setup from './setup';

export enum PreferencesType {
    Account = 'account',
    Info = 'info',
    Setting = 'setting',
    Header = 'header',
}
export interface PreferencesListType {
    key: PreferencesType;
    name: PreferencesType;
    icon: string;
    element: () => JSX.Element;
}

const LoginInfoDiv = styled.div`
    height: 100%;
    display: flex;
    flex-direction: column;
    border-top-width: 1px;
    padding: 0.6em 0.8em 0.8em;
    > div {
        user-select: none;
        cursor: pointer;
    }
    .user {
        white-space: nowrap;
        max-width: 164px;
        overflow-x: auto;
        font-size: 0.875rem;
        line-height: 1.25rem;
        font-weight: 400;
    }
    .user::-webkit-scrollbar {
        display: none;
    }
    .avatar-img {
        display: flex;
        align-items: center;
    }
    .user-name {
        /* ml-2 */
        margin-left: 0.5rem;
        p {
        }
    }
`;

const Container = styled.div`
    display: flex;
    > .nav-menu {
        flex-grow: 0;
        border: 1px solid #e9ebf0;
    }
    > .nav-content {
        padding: 1em;
        flex-grow: 1;
        flex-shrink: 1;
        border-top: 1px solid #e9ebf0;
        border-right: 1px solid #e9ebf0;
        border-bottom: 1px solid #e9ebf0;
    }
`;

const LoginInfo: FC = () => {
    const { commonStore, userStore } = useGlobalStore();
    const { navMode } = commonStore;
    const { userName } = userStore;
    const [loginHidden, setLoginHidden] = useState(true);
    const [tab, setTab] = useState<PreferencesType>(PreferencesType.Account);

    const settingMenuList = useMemo<INavLinkGroup[]>(() => {
        return [
            {
                links: [
                    {
                        url: `#preference/${PreferencesType.Account}`,
                        key: PreferencesType.Account,
                        name: PreferencesType.Account,
                        icon: 'Home',
                        forceAnchor: true,
                        iconProps: { iconName: 'Home' },
                        onClick(e: any) {
                            e.preventDefault();
                            setTab(PreferencesType.Account);
                        },
                    },
                    {
                        url: `#preference/${PreferencesType.Setting}`,
                        key: PreferencesType.Setting,
                        name: PreferencesType.Setting,
                        icon: 'Settings',
                        forceAnchor: true,
                        iconProps: { iconName: 'Settings' },
                        onClick(e: any) {
                            e.preventDefault();
                            setTab(PreferencesType.Setting);
                        },
                    },
                ],
            },
        ];
    }, []);

    return (
        <LoginInfoDiv>
            <div
                onClick={() => {
                    setLoginHidden(false);
                }}
                role="button"
                aria-haspopup
            >
                <Dialog
                    modalProps={{
                        isBlocking: true,
                    }}
                    hidden={loginHidden}
                    onDismiss={() => {
                        setLoginHidden(true);
                    }}
                    dialogContentProps={{ title: intl.get('login.preferences') }}
                    minWidth={550}
                >
                    <Container>
                        <div className="nav-menu">
                            <Nav selectedKey={tab} groups={settingMenuList} />
                        </div>
                        <div className="nav-content">
                            {tab === PreferencesType.Account && <Account />}
                            {tab === PreferencesType.Setting && <Setup />}
                        </div>
                    </Container>
                    {/* <Container>
                        <Pivot className="content" selectedKey={tab} onLinkClick={item => item && setTab(item.props.itemKey as typeof tab)}>
                            {preferencesList.map(pref => (
                                <PivotItem key={pref.key} itemKey={pref.key} headerText={intl.get(`login.${pref.name}`)} itemIcon={pref.icon}>
                                    {pref.element()}
                                </PivotItem>
                            ))}
                        </Pivot>
                    </Container> */}
                </Dialog>
                <div className="avatar-img">
                    {navMode === 'text' && (
                        <div className="user-name">
                            <p className="user">{userName || intl.get('login.clickLogin')}</p>
                        </div>
                    )}
                </div>
            </div>
        </LoginInfoDiv>
    );
};

export default observer(LoginInfo);
