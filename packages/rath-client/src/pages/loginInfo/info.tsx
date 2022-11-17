import { useState } from 'react';
import { DefaultButton, PrimaryButton, TextField } from '@fluentui/react';

import styled from 'styled-components';
const Info = styled.div`
    width: 100%;
    height: 100%;
`;
const InfoDiv = styled.div`
    > div {
        width: 100%;
        display: flex;
        align-items: center;
        margin-bottom: 20px;
        padding-left: 10px;
        padding-top: 10px;
        > span:first-child {
            display: inline-block;
            width: 120px;
        }
        > span:last-child {
            display: inline-block;
            flex: 1;
        }
    }
    .replace {
        display: flex;
        justify-content: space-between;
        align-items: center;
    }
`;

const LoginDiv = styled.div`
    width: 100%;
    height: 100%;
    position: relative;
    > div:last-child {
        width: 100%;
        text-align: right;
    }
    .get-cert-code {
        margin-top: 10px;
        text-align: right;
    }

    .action {
        position: absolute;
        bottom: 0;
    }
`;

enum LoginStatusType {
    account = 'account',
    phone = 'phone',
    email = 'email',
}

function Information() {
    const [userName, setUserName] = useState<string>('');
    const [userNameInfo, setUserNameInfo] = useState<{ username: string; password: string }>({
        username: '',
        password: '',
    });
    const [phoneNumber, setPhoneNumber] = useState<string>('');
    const [phoneNumberInfo, setPhoneNumberInfo] = useState<{ phoneNumber: string; certCode: string }>({
        phoneNumber: '',
        certCode: '',
    });
    const [emailAddress, setEmailAddress] = useState<string>('');
    const [emailAddressInfo, setEmailAddressInfo] = useState<{ emailAddress: string; certCode: string }>({
        emailAddress: '',
        certCode: '',
    });
    const [isLoginStatus, setIsLoginStatus] = useState<LoginStatusType | null>(null);
    return (
        <Info>
            {isLoginStatus === LoginStatusType.account && (
                <LoginDiv>
                    <TextField
                        label="account"
                        required
                        onChange={(e, data) => {
                            data &&
                                setUserNameInfo({
                                    ...userNameInfo,
                                    username: data,
                                });
                        }}
                    ></TextField>
                    <TextField
                        label="password"
                        required
                        onChange={(e, data) => {
                            data &&
                                setUserNameInfo({
                                    ...userNameInfo,
                                    password: data,
                                });
                        }}
                    ></TextField>
                    <div className="mt-2 action">
                        <DefaultButton
                            className="ml-2"
                            onClick={() => {
                                setIsLoginStatus(null);
                            }}
                        >
                            Return
                        </DefaultButton>
                        <PrimaryButton
                            className="ml-2"
                            onClick={() => {
                                setUserName(userNameInfo.username);
                                setIsLoginStatus(null);
                            }}
                        >
                            Action
                        </PrimaryButton>
                    </div>
                </LoginDiv>
            )}
            {isLoginStatus === LoginStatusType.phone && (
                <LoginDiv>
                    <TextField
                        label="Phone Number"
                        required
                        onChange={(e, data) => {
                            data &&
                                setPhoneNumberInfo({
                                    ...phoneNumberInfo,
                                    phoneNumber: data,
                                });
                        }}
                    ></TextField>
                    <div>
                        <TextField
                            label="Cert Code"
                            required
                            onChange={(e, data) => {
                                data &&
                                    setPhoneNumberInfo({
                                        ...phoneNumberInfo,
                                        certCode: data,
                                    });
                            }}
                        ></TextField>
                        <div className="get-cert-code">
                            <PrimaryButton>获取验证码</PrimaryButton>
                        </div>
                    </div>
                    <div className="mt-2 action">
                        <DefaultButton
                            className="ml-2"
                            onClick={() => {
                                setIsLoginStatus(null);
                            }}
                        >
                            Return
                        </DefaultButton>
                        <PrimaryButton
                            className="ml-2"
                            onClick={() => {
                                setPhoneNumber(phoneNumberInfo.phoneNumber);
                                setIsLoginStatus(null);
                            }}
                        >
                            Action
                        </PrimaryButton>
                    </div>
                </LoginDiv>
            )}
            {isLoginStatus === LoginStatusType.email && (
                <LoginDiv>
                    <TextField
                        label="Email Address"
                        required
                        onChange={(e, data) => {
                            data &&
                                setEmailAddressInfo({
                                    ...emailAddressInfo,
                                    emailAddress: data,
                                });
                        }}
                    ></TextField>
                    <div>
                        <TextField
                            label="Cert Code"
                            required
                            onChange={(e, data) => {
                                data &&
                                    setEmailAddressInfo({
                                        ...emailAddressInfo,
                                        certCode: data,
                                    });
                            }}
                        ></TextField>
                        <div className="get-cert-code">
                            <PrimaryButton>获取验证码</PrimaryButton>
                        </div>
                    </div>
                    <div className="mt-2 action">
                        <DefaultButton
                            className="ml-2"
                            onClick={() => {
                                setIsLoginStatus(null);
                            }}
                        >
                            Return
                        </DefaultButton>
                        <PrimaryButton
                            className="ml-2"
                            onClick={() => {
                                setEmailAddress(emailAddressInfo.emailAddress);
                                setIsLoginStatus(null);
                            }}
                        >
                            Action
                        </PrimaryButton>
                    </div>
                </LoginDiv>
            )}
            {isLoginStatus === null && (
                <InfoDiv>
                    <div>
                        <span>Account:</span>
                        <span>
                            {userName ? (
                                <span className="replace">
                                    {userName} <PrimaryButton className="ml-2">Sign up</PrimaryButton>
                                </span>
                            ) : (
                                <PrimaryButton onClick={() => [setIsLoginStatus(LoginStatusType.account)]}>
                                    Sign in
                                </PrimaryButton>
                            )}
                        </span>
                    </div>
                    {userName && (
                        <div>
                            <span>Phone Number:</span>
                            <span>
                                {phoneNumber ? (
                                    <span className="replace">
                                        {phoneNumber}{' '}
                                        <PrimaryButton
                                            className="ml-2"
                                            onClick={() => {
                                                setIsLoginStatus(LoginStatusType.phone);
                                            }}
                                        >
                                            更换手机号
                                        </PrimaryButton>
                                    </span>
                                ) : (
                                    <PrimaryButton onClick={() => [setIsLoginStatus(LoginStatusType.phone)]}>
                                        绑定手机号
                                    </PrimaryButton>
                                )}
                            </span>
                        </div>
                    )}
                    {userName && (
                        <div>
                            <span>Email Address:</span>
                            <span>
                                {emailAddress ? (
                                    <span className="replace">
                                        {emailAddress}{' '}
                                        <PrimaryButton
                                            className="ml-2"
                                            onClick={() => [setIsLoginStatus(LoginStatusType.email)]}
                                        >
                                            更换邮箱
                                        </PrimaryButton>
                                    </span>
                                ) : (
                                    <PrimaryButton onClick={() => [setIsLoginStatus(LoginStatusType.email)]}>
                                        绑定邮箱
                                    </PrimaryButton>
                                )}
                            </span>
                        </div>
                    )}
                </InfoDiv>
            )}
        </Info>
    );
}

export default Information;
