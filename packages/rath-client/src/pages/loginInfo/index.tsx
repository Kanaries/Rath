import { FC, useState } from 'react';
import intl from 'react-intl-universal';
import { observer } from 'mobx-react-lite';
import { Dialog, Pivot, PivotItem } from '@fluentui/react';
import styled from 'styled-components';
import { useGlobalStore } from '../../store';
import Account from './account';
import Setup from './setup';


export enum PreferencesType {
    Account = 'account',
    Info = 'info',
    Setting = 'setting',
    Header = 'header'
}
export interface PreferencesListType {
    key: PreferencesType;
    name: PreferencesType;
    icon: string;
    element: () => JSX.Element;
}

const preferencesList: PreferencesListType[] = [
    { key: PreferencesType.Account, name: PreferencesType.Account, icon: 'Home', element: () => <Account /> },
    // { key: PreferencesType.Info, name: PreferencesType.Info, icon: 'Info', element: () => <Info /> },
    // { key: PreferencesType.Header, name: PreferencesType.Header, icon: 'Contact', element: () => <Header /> },
    { key: PreferencesType.Setting, name: PreferencesType.Setting, icon: 'Settings', element: () => <Setup /> },
];

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
    & .content {
        display: flex;
        flex-direction: row;
        > [role=tablist] {
            flex-grow: 0;
            flex-shrink: 0;
            display: flex;
            flex-direction: column;
            border-right: 1px solid #8888;
            > [role=tab] {
                margin: 0px 4px 8px 0;
                ::before {
                    right: 0px;
                    width: 2px;
                    height: unset;
                    top: 2px;
                    bottom: 2px;
                    left: unset;
                    transition: unset;
                }
            }
        }
        > [role=tabpanel] {
            flex-grow: 1;
            flex-shrink: 1;
        }
    }
`;

const LoginInfo: FC = () => {
    const { commonStore, userStore } = useGlobalStore();
    const { navMode } = commonStore;
    const { userName } = userStore;
    const [loginHidden, setLoginHidden] = useState(true);
    const [tab, setTab] = useState<PreferencesType>(PreferencesType.Account);

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
                        <Pivot className="content" selectedKey={tab} onLinkClick={item => item && setTab(item.props.itemKey as typeof tab)}>
                            {preferencesList.map(pref => (
                                <PivotItem key={pref.key} itemKey={pref.key} headerText={intl.get(`login.${pref.name}`)} itemIcon={pref.icon}>
                                    {pref.element()}
                                </PivotItem>
                            ))}
                        </Pivot>
                    </Container>
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
