import intl from 'react-intl-universal';
import styled from 'styled-components';
import { useEffect, useMemo, useRef, useState } from 'react';
import dayjs from 'dayjs';
import { observer } from "mobx-react-lite";
import { ActionButton, DefaultButton, Icon, TooltipHost, TooltipOverflowMode } from '@fluentui/react';
import { useGlobalStore } from '../../../store';
import useBoundingClientRect from '../../../hooks/use-bounding-client-rect';
import { formatSize } from '../history/history-list-item';
import type { INotebook } from '../../../store/userStore';
import type { IDatasetMeta } from '../../../interfaces';


const Container = styled.div`
    width: 100%;
    > div {
        width: 100%;
        &.list {
            margin: 1em 0;
        }
    }
`;

const List = styled.div`
    margin: 0.4em 0 1em;
    height: 26em;
    width: 100%;
    overflow: hidden auto;
    display: grid;
    gap: 0.4em;
    grid-auto-rows: max-content;
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

const ListItem = styled.div`
    display: flex;
    flex-direction: column;
    overflow: hidden;
    height: 100%;
    padding: 0.4em 1em 1em 1.4em;
    border-radius: 4px;
    position: relative;
    box-shadow: inset 0 0 2px #8881;
    > .head {
        display: flex;
        align-items: center;
        > i {
            flex-grow: 0;
            flex-shrink: 0;
            font-size: 2rem;;
            margin-right: 0.5em;
            user-select: none;
        }
        > header {
            flex-grow: 1;
            flex-shrink: 1;
            overflow: hidden;
            font-size: 0.8rem;
            line-height: 1.5em;
            font-weight: 550;
            white-space: nowrap;
            text-overflow: ellipsis;
            overflow: hidden;
            color: #111;
        }
    }
    .time, .size {
        font-size: 0.5rem;
        color: #888;
    }
    :hover {
        background-color: #8881;
    }
    cursor: pointer;
    &[aria-disabled="true"] {
        pointer-events: none;
        opacity: 0.6;
    }
`;

const ITEM_MIN_WIDTH = 240;

export enum CloudItemType {
    NOTEBOOK = 'notebook',
    DATASET = 'dataset',
}

const KanariesCloudSpace = observer<{ setLoadingAnimation: (on: boolean) => void }>(function KanariesCloudSpace ({ setLoadingAnimation }) {
    const { userStore } = useGlobalStore();
    const { info } = userStore;
    const { organizations } = info ?? {};
    const [busy, setBusy] = useState(false);

    const [organizationIdx, setOrganizationIdx] = useState(0);
    useEffect(() => {
        setOrganizationIdx(0);
    }, [organizations]);

    const organization = organizations?.[organizationIdx];
    const workspaces = organization?.workspaces;

    useEffect(() => {
        if (organization && organization.workspaces === undefined) {
            userStore.getWorkspaces(organization.name);
        }
    }, [organization, userStore]);

    const [workspaceIdx, setWorkspaceIdx] = useState(0);
    useEffect(() => {
        setWorkspaceIdx(0);
    }, [workspaces]);

    const workspace = workspaces?.[workspaceIdx];

    const [typeFilter, setTypeFilter] = useState<CloudItemType | 'total'>('total');

    const list = (workspace?.notebooks ?? []).map<{
        type: CloudItemType.NOTEBOOK;
        notebook: INotebook;
    } | {
        type: CloudItemType.DATASET;
        dataset: IDatasetMeta;
    }>(notebook => ({
        type: CloudItemType.NOTEBOOK,
        notebook,
    })).concat((workspace?.datasets ?? []).map(dataset => ({
        type: CloudItemType.DATASET,
        dataset,
    }))).filter(item => typeFilter === 'total' || item.type === typeFilter);
    
    const listRef = useRef<HTMLDivElement>(null);
    const { width } = useBoundingClientRect(listRef, { width: true });
    const colCount = useMemo(() => Math.floor((width ?? (window.innerWidth * 0.6)) / ITEM_MIN_WIDTH), [width]);

    useEffect(() => {
        if (organization && workspace && workspace.notebooks === undefined) {
            userStore.getNotebooksAndDatasets(organization.name, workspace.name);
        }
    }, [organization, workspace, userStore]);

    return organizations ? (
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
                <b>/</b>
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
            <div className="list">
                {organization && workspace && (
                    <>
                        <List role="grid" ref={listRef} aria-colcount={colCount || 1} style={{ gridTemplateColumns: `repeat(${colCount || 1}, 1fr)` }}>
                            {list.map((item, i) => {
                                if (item.type === CloudItemType.NOTEBOOK) {
                                    const { notebook } = item;
                                    return (
                                        <ListItem
                                            key={i}
                                            role="gridcell"
                                            aria-rowindex={Math.floor(i / colCount) + 1}
                                            aria-colindex={(i % colCount) + 1}
                                            aria-disabled={busy}
                                            onClick={() => {
                                                if (busy) {
                                                    return;
                                                }
                                                setBusy(true);
                                                setLoadingAnimation(true);
                                                userStore.openNotebook(notebook.downLoadURL).finally(() => {
                                                    setBusy(false);
                                                    setLoadingAnimation(false);
                                                });
                                            }}
                                        >
                                            <div className="head" role="button" tabIndex={0}>
                                                <Icon iconName="Inbox" />
                                                <header>
                                                    <TooltipHost content={notebook.name}>
                                                        <span>{notebook.name}</span>
                                                    </TooltipHost>
                                                </header>
                                            </div>
                                            <div className="time">
                                                <p>{`${intl.get('storage.createdAt')}: ${dayjs(notebook.createAt * 1_000).toDate().toLocaleString()}`}</p>
                                            </div>
                                            <div className="size">
                                                <p>{`${intl.get('storage.size')}: ${formatSize(notebook.size / 1_000)}`}</p>
                                            </div>
                                        </ListItem>
                                    );
                                } else if (item.type === CloudItemType.DATASET) {
                                    const { dataset } = item;
                                    return (
                                        <ListItem
                                            key={i}
                                            role="gridcell"
                                            aria-rowindex={Math.floor(i / colCount) + 1}
                                            aria-colindex={(i % colCount) + 1}
                                            aria-disabled={busy}
                                            onClick={() => {
                                                if (busy) {
                                                    return;
                                                }
                                                setBusy(true);
                                                setLoadingAnimation(true);
                                                userStore.openDataset(dataset).finally(() => {
                                                    setBusy(false);
                                                    setLoadingAnimation(false);
                                                });
                                            }}
                                        >
                                            <div className="head" role="button" tabIndex={0}>
                                                <Icon iconName="Package" />
                                                <header>
                                                    <TooltipHost content={dataset.name}>
                                                        <span>{dataset.name}</span>
                                                    </TooltipHost>
                                                </header>
                                            </div>
                                            <div className="time">
                                                <p>{`${intl.get('storage.createdAt')}: ${dayjs(dataset.createAt * 1_000).toDate().toLocaleString()}`}</p>
                                            </div>
                                            <div className="size">
                                                <p>{`${intl.get('storage.size')}: ${formatSize(dataset.size / 1_000)}`}</p>
                                            </div>
                                        </ListItem>
                                    );
                                }
                                return null;
                            })}
                        </List>
                        <DefaultButton
                            text={intl.get('storage.refresh')}
                            onClick={() => userStore.getNotebooksAndDatasets(organization.name, workspace.name, true)}
                        />
                    </>
                )}
            </div>
        </Container>
    ) : null;
});


export default KanariesCloudSpace;
