import intl from 'react-intl-universal';
import { Dropdown } from "@fluentui/react";
import { observer } from "mobx-react-lite";
import type { IOrganization, IWorkspace } from "../../../store/userStore";

export interface IBackupFormHandler {
    submit: (download: boolean) => Promise<boolean>;
}

export interface IBackupFormProps {
    setBusy: (busy: boolean) => void;
    setCanBackup: (able: boolean) => void;
    organizations: readonly IOrganization[];
    organizationName: string | null;
    setOrganizationName: (name: string) => void;
    workspaces: readonly IWorkspace[];
    workspaceName: string | null;
    setWorkspaceName: (name: string) => void;
}

export const OrganizationDropdown = observer<IBackupFormProps>(({
    organizations, organizationName, setOrganizationName,
}) => {
    return (
        <Dropdown
            label={intl.get('user.organization')}
            options={organizations.map(org => ({ key: org.name, text: org.name }))}
            required
            selectedKey={organizationName}
            onChange={(_, option) => option && setOrganizationName(option.key as string)}
        />
    );
});

export const WorkspaceDropdown = observer<IBackupFormProps>(({
    workspaces, workspaceName, setWorkspaceName,
}) => {
    return (
        <Dropdown
            label={intl.get('user.workspace')}
            options={workspaces.map(org => ({ key: org.name, text: org.name }))}
            required
            selectedKey={workspaceName}
            onChange={(_, option) => option && setWorkspaceName(option.key as string)}
        />
    );
});
