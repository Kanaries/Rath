import React from 'react';
import styled from 'styled-components';
import intl from 'react-intl-universal';
import { observer } from 'mobx-react-lite';
import { PrimaryButton, TextField } from '@fluentui/react';
import ActionTextField from '../../../components/actionTextField';
import { IAccessPageKeys } from '../../../interfaces';
import { notify } from '../../../components/error';
import { useGlobalStore } from '../../../store';
import { useCertPhone } from '../../../hooks';
import { validPhone } from './valueCheck';

interface PhoneAuthProps {
    onSuccessLogin: () => void;
}

const PhoneAuthDiv = styled.div`
    > div {
        margin-top: 0.1rem;
    }
    .action {
        text-align: right;
        margin-top: 20px;
    }
`;

const PhoneAuth: React.FC<PhoneAuthProps> = (props) => {
    const { commonStore, langStore } = useGlobalStore();
    const { signup } = commonStore;
    const { clock, startClock } = useCertPhone(signup.phone);
    const { onSuccessLogin } = props;
    const phoneIsValid = validPhone(signup.phone, langStore.lang);
    return (
        <PhoneAuthDiv>
            <div>
                <TextField
                    type="text"
                    value={signup.phone}
                    label={intl.get('login.phone.phoneNo')}
                    required
                    onChange={(e, newValue) => {
                        commonStore.updateForm(IAccessPageKeys.SIGNUP, 'phone', newValue || '');
                    }}
                />
            </div>
            <div>
                <ActionTextField
                    value={signup.certCode}
                    label={intl.get('login.phone.certCode')}
                    onButtonClick={startClock}
                    buttonLabel={clock > 0 ? `${intl.get('login.haveSent')}(${clock}s)` : intl.get('login.getCertCode')}
                    isDisable={!phoneIsValid || clock !== 0}
                    onChange={(newValue) => {
                        commonStore.updateForm(IAccessPageKeys.SIGNUP, 'certCode', newValue || '');
                    }}
                />
            </div>
            <div className="action">
                <PrimaryButton
                    disabled={!phoneIsValid || signup.certCode.length !== 6}
                    onClick={() => {
                        commonStore
                            .liteAuth('phone')
                            .then((res) => {
                                if (res.success) {
                                    onSuccessLogin();
                                    notify({
                                        title: 'Success',
                                        type: 'success',
                                        content: 'Success',
                                    });
                                } else {
                                    notify({
                                        title: 'Error',
                                        type: 'error',
                                        content: `${res.message}`,
                                    });
                                }
                            })
                            .catch((err) => {
                                notify({
                                    title: 'Error',
                                    type: 'error',
                                    content: `[error]${err}`,
                                });
                            });
                    }}
                >
                    {intl.get('login.loginAndRegister')}
                </PrimaryButton>
            </div>
        </PhoneAuthDiv>
    );
};

export default observer(PhoneAuth);
