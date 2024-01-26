import intl from 'react-intl-universal';
import { Dropdown, Stack } from "@fluentui/react";
import styled from 'styled-components';
import { observer } from "mobx-react-lite";
import { useEffect } from "react";
import { useGlobalStore } from "../../store";


const StyledDropdown = styled(Dropdown)`
    width: 20em;
`;

const WorkspaceRole = observer(function WorkspaceRole () {
    const { userStore } = useGlobalStore();
    const { loggedIn, currentWorkspaceName, organization } = userStore;
    
    // const organizations = useMemo(() => info?.organizations ?? [], [info?.organizations]);
    const workspaces = organization?.workspaces ?? [];
    const isWorkspaceListNotFetched = !organization?.workspaces;

    useEffect(() => {
        if (!organization) {
            return;
        }
        if (isWorkspaceListNotFetched) {
            userStore.getWorkspaces(organization.name);
        }
    }, [userStore, organization, isWorkspaceListNotFetched]);

    if (!loggedIn) {
        return null;
    }
    
    return (
        <Stack>
            {/* The user has to decide the organization to continue with Rath so changing another organization is not supported */}
            {/* <StyledDropdown
                label={intl.get('user.organization')}
                options={organizations.map(org => ({ key: org.name, text: org.name }))}
                selectedKey={organization?.name}
                onChange={(_, opt) => opt && userStore.setOrgName(opt.key as string)}
            /> */}
            <StyledDropdown
                label={intl.get('user.workspace')}
                options={workspaces.map(wsp => ({ key: wsp.name, text: wsp.name }))}
                selectedKey={currentWorkspaceName}
                onChange={(_, opt) => opt && userStore.setWspName(opt.key as string)}
            />
        </Stack>
    );
});


export default WorkspaceRole;
