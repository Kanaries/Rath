import React from 'react';
import styled from 'styled-components';
import intl from 'react-intl-universal';
import { observer } from 'mobx-react-lite';
import { PrimaryButton, TextField } from '@fluentui/react';
import ActionTextField from '../../../components/actionTextField';
import { IAccessPageKeys } from '../../../interfaces';
import { notify } from '../../../components/error';
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
    }
`;

const EmailAuth: React.FC<EmailAuthProps> = (props) => {
    const { commonStore } = useGlobalStore();
    const { signup } = commonStore;
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
                        commonStore.updateForm(IAccessPageKeys.SIGNUP, 'email', newValue || '');
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
                        commonStore.updateForm(IAccessPageKeys.SIGNUP, 'certCode', newValue || '');
                    }}
                />
            </div>
            <div className="action">
                <PrimaryButton
                    disabled={!emailIsValid || !originSupportEmail || signup.certCode.length !== 6}
                    onClick={() => {
                        commonStore.liteAuth('email').then((res) => {
                            if (res) {
                                onSuccessLogin();
                            }
                        });
                    }}
                >
                    {intl.get('login.loginAndRegister')}
                </PrimaryButton>
                {!originSupportEmail && <div className="text-red-500 text-xs t-2">{intl.get('access.unsupport')}</div>}
            </div>
        </EmailAuthDiv>
    );
};

export default observer(EmailAuth);
