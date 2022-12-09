import { useState } from 'react';
import styled from 'styled-components';
import intl from 'react-intl-universal';
import { Pivot, PivotItem, PrimaryButton, TextField } from '@fluentui/react';
import { useGlobalStore } from '../../store';
import { IAccessMethod } from '../../interfaces';
import PhoneAuth from './access/phoneAuth';
import EmailAuth from './access/emailAuth';
import PasswordLogin from './access/passwordLogin';

const AccountDiv = styled.div`
    > div {
        width: 100%;
        display: flex;
        flex-direction: column;
        margin-bottom: 20px;
        padding-left: 2em;
        .label {
            font-weight: 600;
            font-size: 14px;
            color: rgb(50, 49, 48);
            font-family: 'Segoe UI', 'Segoe UI Web (West European)', 'Segoe UI', -apple-system, BlinkMacSystemFont,
                Roboto, 'Helvetica Neue', sans-serif;
            -webkit-font-smoothing: antialiased;
        }
        .account {
            display: flex;
            flex-direction: column;
            width: 100%;
            > .label {
                margin-bottom: 1em;
            }
            > button {
                width: max-content;
            }
        }
        .phone {
            width: 100%;
        }
        .email {
            width: 100%;
        }
    }
`;

const PIVOT_LIST = [
    {
        headerText: 'phoneCert',
        itemKey: IAccessMethod.PHONE,
        element: (onSuccessLogin: () => void) => <PhoneAuth onSuccessLogin={onSuccessLogin} />,
    },
    {
        headerText: 'emailCert',
        itemKey: IAccessMethod.EMAIL,
        element: (onSuccessLogin: () => void) => <EmailAuth onSuccessLogin={onSuccessLogin} />,
    },
    {
        headerText: 'passwordLog',
        itemKey: IAccessMethod.PASSWORD,
        element: (onSuccessLogin: () => void) => <PasswordLogin onSuccessLogin={onSuccessLogin} />,
    },
];

function Account() {
    const [isLoginStatus, setIsLoginStatus] = useState<boolean>(false);
    // const [globalSwitch, setGlobalSwitch] = useState(true);
    const { commonStore } = useGlobalStore();
    const { userName, info } = commonStore;
    // const pivots = PIVOT_LIST.map((p) => ({
    //     // ...p,
    //     key: p.itemKey,
    //     name: t(`access.${p.itemKey}.title`),
    // }));

    return (
        <AccountDiv>
            {isLoginStatus ? (
                <div>
                    <div className="mb-4">
                        <Pivot>
                            {PIVOT_LIST.map((item) => (
                                <PivotItem key={item.itemKey} headerText={intl.get(`login.${item.headerText}`)}>
                                    {item.element(() => {
                                        setIsLoginStatus(false);
                                        commonStore.getPersonalInfo();
                                    })}
                                </PivotItem>
                            ))}
                        </Pivot>
                    </div>
                </div>
            ) : (
                <div>
                    <div className="account">
                        <span className="label">Account</span>
                        {userName ? (
                            <PrimaryButton
                                onClick={() => {
                                    commonStore.commitLogout()
                                }}
                            >
                                {intl.get('login.signOut')}
                            </PrimaryButton>
                        ) : (
                            <PrimaryButton onClick={() => [setIsLoginStatus(true)]}>
                                {intl.get('login.signIn')}
                            </PrimaryButton>
                        )}
                        {userName && <TextField value={userName || ''} disabled={true} />}
                    </div>
                    {userName && (
                        <div className="phone">
                            <TextField label="Phone" value={info.phone} disabled={true} />
                        </div>
                    )}
                    {userName && (
                        <div className="email">
                            <TextField label="Email" value={info.email} disabled={true} />
                        </div>
                    )}
                </div>
            )}
        </AccountDiv>
    );
}

export default Account;
