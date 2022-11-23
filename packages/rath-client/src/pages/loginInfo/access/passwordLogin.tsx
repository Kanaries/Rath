import React from 'react';
import styled from 'styled-components';
import intl from 'react-intl-universal';
import { observer } from 'mobx-react-lite';
import { PrimaryButton, TextField } from '@fluentui/react';
import { useGlobalStore } from '../../../store';
import { IAccessPageKeys } from '../../../interfaces';
import { notify } from '../../../components/error';

const PasswordLoginhDiv = styled.div`
    > div {
        margin-top: 0.1rem;
    }
    .action {
        text-align: right;
        margin-top: 20px;
    }
`;

const FORM_FIELDS = [
    { label: '用户名', fieldKey: 'userName', type: 'text' },
    { label: '密码', fieldKey: 'password', type: 'password' },
] as const;

interface PasswordLoginProps {
    onSuccessLogin: () => void;
}

const PasswordLogin: React.FC<PasswordLoginProps> = (props) => {
    const { commonStore } = useGlobalStore();
    const { login } = commonStore;
    const { onSuccessLogin } = props;
    const notEmpty = login.password.length > 0 && login.userName.length > 0;
    const formFields = FORM_FIELDS.map((f) => ({
        ...f,
        label: intl.get(`login.password.${f.fieldKey}`),
    }));

    return (
        <PasswordLoginhDiv>
            {formFields.map((field) => (
                <div key={field.fieldKey}>
                    <TextField
                        type={field.type}
                        value={login[field.fieldKey]}
                        label={field.label}
                        required
                        onChange={(e, newValue) => {
                            commonStore.updateForm(IAccessPageKeys.LOGIN, field.fieldKey, newValue || '');
                        }}
                    />
                </div>
            ))}
            <div className="action">
                <PrimaryButton
                    disabled={!notEmpty}
                    onClick={() => {
                        commonStore
                            .commitLogin()
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
                                        content: `[error]${res.message}`,
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
                    {intl.get('login.login')}
                </PrimaryButton>
            </div>
        </PasswordLoginhDiv>
    );
};

export default observer(PasswordLogin);
