import { useState } from 'react';
import intl from 'react-intl-universal';
import { observer } from 'mobx-react-lite';
import { Dialog } from '@fluentui/react';
import styled from 'styled-components';
import { PreferencesListType } from '../../App';
import { useGlobalStore } from '../../store';
import LoginInfoList from './loginInfo';
interface loginInfoProps {
    preferencesList: PreferencesListType[];
    element: () => JSX.Element;
}

const LoginInfoDiv = styled.div`
    height: 100%;
    display: flex;
    flex-direction: column;
    > div:first-child {
        flex: 1;
    }
    .user {
        white-space: nowrap;
        max-width: 164px;
        overflow-x: auto;
        font-size: 0.875rem;
        line-height: 1.25rem;
        font-weight: 500;
    }
    .user::-webkit-scrollbar {
        display: none;
    }
    .avatar-img {
        display: flex;
        align-items: center;
    }
    .hidden-login {
        /* flex flex-shrink-0 border-t border-indigo-800 p-4 bg-gray-700 cursor-pointer */
        display: flex;
        flex-shrink: 0;
        border-top-width: 1px;
        padding: 1rem;
        cursor: pointer;
    }
    .user-name {
        /* ml-2 */
        margin-left: 0.5rem;
        p {
        }
    }
`;

const LoginInfo = (props: loginInfoProps) => {
    const { preferencesList, element } = props;
    const { commonStore, userStore } = useGlobalStore();
    const { navMode } = commonStore;
    const { userName } = userStore;
    const [loginHidden, setLoginHidden] = useState(true);
    return (
        <LoginInfoDiv>
            <div>{element()}</div>
            <div
                className="hidden-login"
                onClick={() => {
                    setLoginHidden(false);
                }}
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
                    <LoginInfoList infoList={preferencesList} />
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
