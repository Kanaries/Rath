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
        align-items: center;
        margin-bottom: 20px;
        padding-left: 10px;
        padding-top: 10px;
        .label {
            font-weight: 600;
            font-size: 14px;
            color: rgb(50, 49, 48);
            font-family: 'Segoe UI', 'Segoe UI Web (West European)', 'Segoe UI', -apple-system, BlinkMacSystemFont,
                Roboto, 'Helvetica Neue', sans-serif;
            -webkit-font-smoothing: antialiased;
        }
        .account {
            width: 100%;
            > span {
                width: 100%;
            }
            > span:first-child {
                display: flex;
                justify-content: space-between;
                height: 35px;
                line-height: 35px;
                margin-bottom: 3px;
            }
            > span:last-child {
                height: 35px;
                line-height: 35px;
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
    const { userStore } = useGlobalStore();
    const { userName, info } = userStore;
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
                                        userStore.getPersonalInfo();
                                    })}
                                </PivotItem>
                            ))}
                        </Pivot>
                    </div>
                </div>
            ) : (
                <div>
                    <div className="account">
                        <span>
                            <span className="label">Account</span>
                            {userName ? (
                                <PrimaryButton
                                    className="ml-2"
                                    onClick={() => {
                                        userStore.commitLogout()
                                    }}
                                >
                                    {intl.get('login.signOut')}
                                </PrimaryButton>
                            ) : (
                                <PrimaryButton onClick={() => [setIsLoginStatus(true)]}>
                                    {intl.get('login.signIn')}
                                </PrimaryButton>
                            )}
                        </span>
                        {userName && <TextField value={userName || ''} disabled={true} />}
                    </div>
                    {info && (
                        <div className="phone">
                            <TextField label="Phone" value={info.phone} disabled={true} />
                        </div>
                    )}
                    {info && (
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
