import { Dialog, Icon } from '@fluentui/react';
import React, { useState } from 'react';
import styled from 'styled-components';
import { PreferencesListType } from '../../App';
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
`;

const LoginInfo = (props: loginInfoProps) => {
    const { preferencesList, element } = props;

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
                    dialogContentProps={{ title: 'Preferences' }}
                    minWidth={550}
                >
                    <LoginInfoList infoList={preferencesList} />
                </Dialog>
                <div className="flex items-center">
                    <div>
                        <Icon iconName="Contact" className="mr-2" />
                    </div>
                    <div className="ml-3">
                        <p className="text-sm font-medium text-white">{'visitor'}</p>
                    </div>
                </div>
            </div>
        </LoginInfoDiv>
    );
};

export default LoginInfo;
