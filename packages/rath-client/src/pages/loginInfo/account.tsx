import { observer } from 'mobx-react-lite';
import intl from 'react-intl-universal';
import { DefaultButton, Pivot, PivotItem, Stack, TextField } from '@fluentui/react';
import { useGlobalStore } from '../../store';
import { IAccessMethod } from '../../interfaces';
import PhoneAuth from './access/phoneAuth';
import EmailAuth from './access/emailAuth';
import PasswordLogin from './access/passwordLogin';
import WorkspaceRole from './workspaceRole';

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

export const LoginPanel = observer<{ onSuccessLogin?: () => void }>(function LoginPanel({ onSuccessLogin }) {
    const { userStore } = useGlobalStore();

    return (
        <Pivot>
            {PIVOT_LIST.map((item) => (
                <PivotItem key={item.itemKey} headerText={intl.get(`login.${item.headerText}`)}>
                    {item.element(() => {
                        onSuccessLogin?.();
                        userStore.getPersonalInfo();
                    })}
                </PivotItem>
            ))}
        </Pivot>
    );
});

function Account() {
    const { userStore } = useGlobalStore();
    const { info } = userStore;
    const userIsOnline = info !== null && info.userName && info.userName !== '';

    return (
        <div>
            {!userIsOnline && <LoginPanel />}
            {userIsOnline && (
                <div>
                    <Stack tokens={{ childrenGap: 12 }}>
                        <WorkspaceRole />
                        <TextField label="Phone" value={info?.phone} readOnly disabled />
                        <TextField label="Email" value={info?.email} readOnly disabled />
                        <div>
                            <DefaultButton
                                onClick={() => {
                                    userStore.commitLogout();
                                }}
                            >
                                {intl.get('login.signOut')}
                            </DefaultButton>
                        </div>
                    </Stack>
                </div>
            )}
        </div>
    );
}

export default observer(Account);
