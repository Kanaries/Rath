import { observer } from 'mobx-react-lite';
import intl from 'react-intl-universal';
import { DefaultButton, Stack, TextField } from '@fluentui/react';
import { useGlobalStore } from '../../store';
import WorkspaceRole from './workspaceRole';


function Account() {
    const { userStore } = useGlobalStore();
    const { info } = userStore;
    const userIsOnline = info !== null && info.userName && info.userName !== '';

    return (
        <div>
            {userIsOnline && (
                <div>
                    <Stack tokens={{ childrenGap: 12 }}>
                        <WorkspaceRole />
                        <TextField label="Phone" value={info?.phone} disabled />
                        <TextField label="Email" value={info?.email} disabled />
                        <Stack horizontal tokens={{ childrenGap: 12 }}>
                            <DefaultButton
                                onClick={() => {
                                    userStore.setOrgId(null);
                                }}
                            >
                                {intl.get('login.message.reselect_org')}
                            </DefaultButton>
                            <DefaultButton
                                onClick={() => {
                                    userStore.logout();
                                }}
                            >
                                {intl.get('login.message.reselect')}
                            </DefaultButton>
                        </Stack>
                    </Stack>
                </div>
            )}
        </div>
    );
}

export default observer(Account);
