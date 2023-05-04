import { FC, useMemo, useState } from 'react';
import intl from 'react-intl-universal';
import { observer } from 'mobx-react-lite';
import { Dialog, INavLinkGroup, Icon, Nav } from '@fluentui/react';
import styled from 'styled-components';
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
    display: flex;
    align-items: center;
    /* flex-direction: column; */
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
    .user-avatar {
        width: 38px;
        height: 38px;
        border-radius: 19px;
        border: 3px solid #000;
        margin: 0px 12px;
        background-size: contain;
        background-repeat: no-repeat;
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
    const [showUserPanel, setShowUserPanel] = useState(false);
    const [tab, setTab] = useState<PreferencesType>(PreferencesType.Setting);

    const settingMenuList = useMemo<INavLinkGroup[]>(() => {
        return [
            {
                links: [
                    // Account no more supported.
                    // {
                    //     url: `#preference/${PreferencesType.Account}`,
                    //     key: PreferencesType.Account,
                    //     name: PreferencesType.Account,
                    //     icon: 'Home',
                    //     forceAnchor: true,
                    //     iconProps: { iconName: 'Home' },
                    //     onClick(e: any) {
                    //         e.preventDefault();
                    //         setTab(PreferencesType.Account);
                    //     },
                    // },
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
            <Dialog
                modalProps={{
                    isBlocking: true,
                    // to make an error message closable
                    isClickableOutsideFocusTrap: true,
                }}
                hidden={!showUserPanel}
                onDismiss={() => {
                    setShowUserPanel(false);
                }}
                dialogContentProps={{ title: intl.get('login.preferences') }}
                minWidth={550}
            >
                <Container>
                    <div className="nav-menu">
                        <Nav selectedKey={tab} groups={settingMenuList} />
                    </div>
                    <div className="nav-content">
                        {/* {tab === PreferencesType.Account && <Account />} */}
                        {tab === PreferencesType.Setting && <Setup />}
                    </div>
                </Container>
            </Dialog>
            <div
                className="user"
                onClick={() => {
                    setShowUserPanel(true);
                }}
            >
                <Icon
                    iconName="PlayerSettings"
                />
            </div>
        </LoginInfoDiv>
    );
};

export default observer(LoginInfo);
