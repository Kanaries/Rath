import intl from 'react-intl-universal';
import styled from 'styled-components';
import { useCallback, useEffect, useRef, useState } from 'react';
import { observer } from "mobx-react-lite";
import { ActionButton, TooltipHost, TooltipOverflowMode } from '@fluentui/react';
import { useGlobalStore } from '../../../store';
import CloudSpaceList, { CloudItemType } from './spaceList';


const Container = styled.div`
    width: 100%;
    > div {
        width: 100%;
        &.list {
            margin: 1em 0;
        }
    }
`;

const CaretButtonLabel = styled.span`
    font-size: 105%;
    font-weight: 600;
    min-width: 4em;
    max-width: 20vw;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
`;

const KanariesCloudSpace = observer<{ setLoadingAnimation: (on: boolean) => void }>(function KanariesCloudSpace ({ setLoadingAnimation }) {
    const { userStore } = useGlobalStore();
    const { info } = userStore;
    const { organizations } = info ?? {};

    const [loading, setLoading] = useState(false);

    const [organizationIdx, setOrganizationIdx] = useState(0);
    useEffect(() => {
        setOrganizationIdx(0);
    }, [organizations]);

    const organization = organizations?.[organizationIdx];
    const workspaces = organization?.workspaces;

    const curPendingRef = useRef<Promise<unknown>>();

    const pend = useCallback(<T extends any = unknown>(p: Promise<T>): Promise<T> => {
        setLoading(true);
        curPendingRef.current = p;
        p.finally(() => {
            if (p === curPendingRef.current) {
                setLoading(false);
            }
        });
        return p;
    }, []);

    useEffect(() => {
        if (organization && organization.workspaces === undefined) {
            pend(userStore.getWorkspaces(organization.name));
        }
    }, [organization, userStore, pend]);

    const [workspaceIdx, setWorkspaceIdx] = useState(0);
    useEffect(() => {
        setWorkspaceIdx(0);
    }, [workspaces]);

    const workspace = workspaces?.[workspaceIdx];

    useEffect(() => {
        if (organization && workspace && workspace.notebooks === undefined) {
            pend(userStore.getNotebooksAndDatasets(organization.name, workspace.name));
        }
    }, [organization, workspace, userStore, pend]);

    const [typeFilter, setTypeFilter] = useState<CloudItemType | 'total'>('total');

    if (!organization) {
        return null;
    }

    const reloadList = () => {
        if (!workspace) {
            return;
        }
        pend(userStore.getNotebooksAndDatasets(organization.name, workspace.name, true));
    };

    return (
        <Container>
            <div>
                <ActionButton
                    split
                    menuProps={{
                        items: organizations.map((org, i) => ({
                            key: `${org.id}`,
                            text: org.name,
                            onClick() {
                                setOrganizationIdx(i);
                            },
                        })),
                    }}
                    onClick={undefined}
                >
                    <TooltipHost content={organization?.name} overflowMode={TooltipOverflowMode.Parent}>
                        <CaretButtonLabel>
                            {organization?.name}
                        </CaretButtonLabel>
                    </TooltipHost>
                </ActionButton>
                <b>/</b>
                <ActionButton
                    disabled={!workspaces}
                    split
                    menuProps={{
                        items: (workspaces ?? []).map((wsp, i) => ({
                            key: `${wsp.id}`,
                            text: wsp.name,
                            onClick() {
                                setWorkspaceIdx(i);
                            },
                        })),
                    }}
                    styles={{ label: { fontSize: '105%', fontWeight: 600, padding: '0 0.4em', minWidth: '4em' } }}
                    onClick={undefined}
                >
                    <TooltipHost content={workspace?.name} overflowMode={TooltipOverflowMode.Parent}>
                        <CaretButtonLabel>
                            {workspace?.name}
                        </CaretButtonLabel>
                    </TooltipHost>
                </ActionButton>
                <b>{'/'}</b>
                <ActionButton
                    disabled={!workspaces}
                    split
                    menuProps={{
                        items: (['total', CloudItemType.DATASET, CloudItemType.NOTEBOOK] as const).map(iType => ({
                            key: iType,
                            text: intl.get(`dataSource.importData.cloud.${iType}`),
                            onClick() {
                                setTypeFilter(iType);
                            },
                        })),
                    }}
                    styles={{ label: { fontSize: '105%', fontWeight: 600, padding: '0 0.8em', minWidth: '4em' } }}
                    onClick={undefined}
                >
                    <TooltipHost content={intl.get(`dataSource.importData.cloud.${typeFilter}`)} overflowMode={TooltipOverflowMode.Parent}>
                        <CaretButtonLabel>
                            {intl.get(`dataSource.importData.cloud.${typeFilter}`)}
                        </CaretButtonLabel>
                    </TooltipHost>
                </ActionButton>
            </div>
            <CloudSpaceList
                loading={loading}
                filter={typeFilter}
                setLoadingAnimation={setLoadingAnimation}
                workspace={workspace}
                reload={reloadList}
            />
        </Container>
    );
});


export default KanariesCloudSpace;
