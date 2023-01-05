import React from 'react';
import styled from 'styled-components';
import intl from 'react-intl-universal';
import { observer } from 'mobx-react-lite';
import { PrimaryButton, TextField } from '@fluentui/react';
import ActionTextField from '../../../components/actionTextField';
import { IAccessPageKeys } from '../../../interfaces';
import { useGlobalStore } from '../../../store';
import { useCertMail } from '../../../hooks';
import { validEmail } from './valueCheck';

interface EmailAuthProps {
    onSuccessLogin: () => void;
}

const EmailAuthDiv = styled.div`
    > div {
        margin-top: 0.1rem;
    }
    .action {
        text-align: right;
        margin-top: 20px;
        .error {
            color: rgb(255, 71, 71);
            font-size: 0.9rem;
            margin-top: 0.5em;
        }
    }
`;

const EmailAuth: React.FC<EmailAuthProps> = (props) => {
    const { userStore } = useGlobalStore();
    const { signup } = userStore;
    const { onSuccessLogin } = props;
    const originSupportEmail = window.location.hostname !== 'kanaries.cn';
    const email = signup.email;
    const emailIsValid = validEmail(email);
    const { clock, startClock } = useCertMail(email);
    return (
        <EmailAuthDiv>
            <div>
                <TextField
                    value={email}
                    label={intl.get('login.email.title')}
                    required
                    onChange={(e, newValue) => {
                        userStore.updateForm(IAccessPageKeys.SIGNUP, 'email', newValue || '');
                    }}
                    errorMessage={email.length > 0 && !emailIsValid ? intl.get('login.email.errEmail') : ''}
                />
            </div>
            <div>
                <ActionTextField
                    value={signup.certCode}
                    label={intl.get('login.email.certCode')}
                    onButtonClick={startClock}
                    buttonLabel={clock > 0 ? `${intl.get('login.haveSent')}(${clock}s)` : intl.get('login.getCertCode')}
                    isDisable={!emailIsValid || email.length === 0 || !originSupportEmail || clock !== 0}
                    onChange={(newValue) => {
                        userStore.updateForm(IAccessPageKeys.SIGNUP, 'certCode', newValue || '');
                    }}
                />
            </div>
            <div className="action">
                <PrimaryButton
                    disabled={!emailIsValid || !originSupportEmail || signup.certCode.length !== 6}
                    onClick={() => {
                        userStore.liteAuth('email').then((res) => {
                            if (res) {
                                onSuccessLogin();
                            }
                        });
                    }}
                >
                    {intl.get('login.loginAndRegister')}
                </PrimaryButton>
                {!originSupportEmail && <div className="error">{intl.get('access.unsupport')}</div>}
            </div>
        </EmailAuthDiv>
    );
};

export default observer(EmailAuth);
