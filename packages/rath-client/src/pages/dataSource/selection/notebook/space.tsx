import intl from 'react-intl-universal';
import styled from 'styled-components';
import { useEffect, useMemo, useRef, useState } from 'react';
import dayjs from 'dayjs';
import { observer } from "mobx-react-lite";
import { ActionButton, DefaultButton, Icon, TooltipHost } from '@fluentui/react';
import { useGlobalStore } from '../../../../store';
import useBoundingClientRect from '../../../../hooks/use-bounding-client-rect';
import { formatSize } from '../history/history-list-item';


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

const CaretButton = styled(ActionButton)`
    button {
        position: absolute;
        top: 0;
        right: 0;
        margin: 0;
        padding: 0;
        font-size: 12px;
        background-color: #d13438 !important;
        border-radius: 50%;
        color: #fff !important;
        width: 1.2em;
        height: 1.2em;
        i {
            font-weight: 1000;
            line-height: 1em;
            width: 1em;
            height: 1em;
            transform: scale(0.4);
        }
        opacity: 0.5;
        :hover {
            opacity: 1;
        }
        .ms-Button-label {
            font-size: 105%;
            font-weight: 600;
            padding: 0 0.4em;
            min-width: 4em;
        }
    }
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
        & .hover-only {
            visibility: visible;
        }
    }
    cursor: pointer;
`;

const ITEM_MIN_WIDTH = 240;

const NotebookSpace = observer(function NotebookSpace () {
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
            userStore.getWorkspaces(organization.id);
        }
    }, [organization, userStore]);

    const [workspaceIdx, setWorkspaceIdx] = useState(0);
    useEffect(() => {
        setWorkspaceIdx(0);
    }, [workspaces]);

    const workspace = workspaces?.[workspaceIdx];
    const list = workspace?.notebooks ?? [];

    const listRef = useRef<HTMLDivElement>(null);
    const { width } = useBoundingClientRect(listRef, { width: true });
    const colCount = useMemo(() => Math.floor((width ?? (window.innerWidth * 0.6)) / ITEM_MIN_WIDTH), [width]);

    useEffect(() => {
        if (organization && workspace && workspace.notebooks === undefined) {
            userStore.getNotebooks(organization.id, workspace.id);
        }
    }, [organization, workspace, userStore]);

    return organizations ? (
        <Container>
            <div>
                <CaretButton
                    text={organization?.name}
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
                />
                <b>/</b>
                <CaretButton
                    text={workspace?.name}
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
                />
            </div>
            <div className="list">
                {organization && workspace && (
                    <>
                        <List role="grid" ref={listRef} aria-colcount={colCount || 1} style={{ gridTemplateColumns: `repeat(${colCount || 1}, 1fr)` }}>
                            {list.map((notebook, i) => (
                                <ListItem
                                    key={i}
                                    role="gridcell"
                                    aria-rowindex={Math.floor(i / colCount) + 1}
                                    aria-colindex={(i % colCount) + 1}
                                    onClick={() => {
                                        if (busy) {
                                            return;
                                        }
                                        setBusy(true);
                                        userStore.openNotebook(notebook.downLoadURL).finally(() => {
                                            setBusy(false);
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
                            ))}
                        </List>
                        <DefaultButton
                            text={intl.get('storage.refresh')}
                            onClick={() => userStore.getNotebooks(organization.id, workspace.id)}
                        />
                    </>
                )}
            </div>
        </Container>
    ) : null;
});


export default NotebookSpace;
