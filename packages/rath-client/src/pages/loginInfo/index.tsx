import { useState } from 'react';
import intl from 'react-intl-universal';
import { observer } from 'mobx-react-lite';
import { Dialog, Icon } from '@fluentui/react';
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
    }
    .user::-webkit-scrollbar {
        display: none;
    }
`;

const LoginInfo = (props: loginInfoProps) => {
    const { preferencesList, element } = props;
    const { commonStore } = useGlobalStore();
    const { userName, navMode, avatarUrl, info } = commonStore;
    const [loginHidden, setLoginHidden] = useState(true);
    return (
        <LoginInfoDiv>
            <div>{element()}</div>
            <div
                className="flex flex-shrink-0 border-t border-indigo-800 p-4 bg-gray-700 cursor-pointer"
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
                <div className="flex items-center">
                    <div>
                        {userName && (info.avatar || avatarUrl) ? (
                            <img
                                src={info.avatar || avatarUrl}
                                alt="头像"
                                style={{ width: 24, height: 24, borderRadius: '50%' }}
                            />
                        ) : (
                            <Icon iconName="Contact" className="mr-2" />
                        )}
                    </div>
                    {navMode === 'text' && (
                        <div className="ml-2">
                            <p className="text-sm font-medium user">{userName || intl.get('login.clickLogin')}</p>
                        </div>
                    )}
                </div>
            </div>
        </LoginInfoDiv>
    );
};

export default observer(LoginInfo);
