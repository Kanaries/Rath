import { ActionButton, DetailsList, DetailsRow, IColumn, IconButton, IDetailsRowProps, Layer, Popup, SelectionMode, Stack, TextField } from '@fluentui/react';
import intl from 'react-intl-universal';
import { observer } from 'mobx-react-lite';
import { FC, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import styled from 'styled-components';
import { useGlobalStore } from '../../store';
import type { DashboardDocument } from '../../store/dashboardStore';
import DocumentPreview from './document-preview';


const PageLayout = styled.div`
    flex-grow: 1;
    flex-shrink: 1;
    height: calc(100vh - 16px);
    display: flex;
    flex-direction: column;
    overflow: hidden;
    > div {
        background-color: #fff;
        margin-inline: 2em;
        padding-block: 1.5em;
        padding-inline: 3em;
        border-radius: 2px;
        box-shadow: 0 1.6px 3.6px 0 rgb(0 0 0 / 13%), 0 0.3px 0.9px 0 rgb(0 0 0 / 11%);
    }
`;

const WorkspaceView = styled.div`
    flex-grow: 0;
    flex-shrink: 0;
    overflow: hidden;
    margin-top: 0.75em;
    margin-bottom: 1em;
    border-bottom: 1px solid #8884;
`;

const DocumentListView = styled.div`
    flex-grow: 1;
    flex-shrink: 1;
    display: flex;
    flex-direction: column;
    overflow: hidden;
    margin-bottom: 2em;
`;

const TableContainer = styled.div`
    flex-grow: 1;
    flex-shrink: 1;
    overflow: hidden;
    overflow-y: auto;
    margin-block: 1em;
    padding-bottom: 1em;
`;

const WorkspaceName = styled.div`
    font-size: 17.5px;
    font-weight: 500;
    line-height: 1.6em;
    height: 1.6em;
    margin-block: 0.8em;
    position: relative;
`;

const WorkspaceDesc = styled.div`
    font-size: 14px;
    line-height: 1.6em;
    height: 1.6em;
    margin-bottom: 1.5em;
    color: #888;
    position: relative;
`;

const CustomRow = styled.div`
    cursor: pointer;
    .button-group {
        opacity: 0;
    }
    :hover .button-group {
        opacity: 1;
    }
    position: relative;
`;

const ButtonGroup = styled.div`
    > button {
        margin-block: -6px;
        :hover {
            background-color: #8882;
        }
    }
`;

const Editable = styled.div`
    > button[type=button] {
        position: absolute;
        right: 0;
        top: 50%;
        transform: translateY(-50%);
        opacity: 0;
        backdrop-filter: blur(100vmax);
        :hover {
            background-color: #8882;
        }
    }
    :hover > button[type=button] {
        opacity: 1;
    }
`;

const MAX_SIZE = Math.min(512, Math.min(window.innerWidth, window.innerHeight) * 0.15);

const adjustSize = ({ w, h }: { w: number; h: number; }): [number, number] => {
    const scale = MAX_SIZE / Math.max(w, h);
    return [w * scale, h * scale];
};

const PreviewPopup = styled.div`
    pointer-events: none;
    position: fixed;
    transform: translate(-50%, calc(-100% - 4px));
    --bg-color: #fff;
    width: 200px;
    height: 150px;
    background-color: var(--bg-color);
    filter: drop-shadow(0 1.6px 3.6px rgb(0 0 0 / 26%)) drop-shadow(0 0.3px 0.9px rgb(0 0 0 / 22%));
    ::after {
        position: absolute;
        content: "";
        top: 100%;
        left: 50%;
        transform: translate(-50%, -50%) rotate(45deg);
        --size: 16px;
        width: var(--size);
        height: var(--size);
        background-color: var(--bg-color);
    }
`;

const Row = observer(function Row ({
    content, handleClick, handleMouseOn, handleMouseOut,
}: { content: IDetailsRowProps; handleClick: () => void; handleMouseOn: (x: number, y: number) => void; handleMouseOut: () => void; }) {
    return (
        <CustomRow
            onClick={handleClick}
            onMouseEnter={e => {
                const { y } = (e.target as HTMLDivElement).getBoundingClientRect();
                handleMouseOn(e.clientX, y);
            }}
            onMouseLeave={handleMouseOut}
        >
            <DetailsRow {...content} />
        </CustomRow>
    );
});

const EditableCell: FC<{ onEdit: (clear?: () => void) => void; value: string; placeholder: string; onChange: (value: string) => void }> = ({
    onEdit, value, onChange, placeholder
}) => {
    const [isEditing, setEditing] = useState(false);
    const [data, setData] = useState('');

    useEffect(() => {
        setData(value);
    }, [value, isEditing]);

    return (
        <Editable>
            {isEditing ? (
                <TextField
                    value={data}
                    onChange={(_, d) => setData(d ?? '')}
                    onClick={e => e.stopPropagation()}
                    onKeyDown={e => {
                        if (e.key === 'Enter') {
                            const d = data;
                            requestAnimationFrame(() => onChange(d));
                            setEditing(false);
                            onEdit();
                        } else if (e.key === 'Escape') {
                            setEditing(false);
                            onEdit();
                        }
                    }}
                />
            ) : (
                <span>
                    {value || placeholder}
                </span>
            )}
            {isEditing || (
                <IconButton
                    iconProps={{ iconName: 'Edit' }}
                    autoFocus
                    onClick={e => {
                        e.stopPropagation();
                        setEditing(true);
                        onEdit(() => setEditing(false));
                    }}
                />
            )}
        </Editable>
    );
};

export type FlatDocumentInfo = {
    index: number;
    name: DashboardDocument['info']['name'];
    description: DashboardDocument['info']['description'];
    source: DashboardDocument['data']['source'];
    createTime: DashboardDocument['info']['createTime'];
    lastModifyTime: DashboardDocument['info']['lastModifyTime'];
};

export interface DashboardListProps {
    openDocument: (index: number) => void;
}

const DashboardList: FC<DashboardListProps> = ({ openDocument }) => {
    const { dashboardStore } = useGlobalStore();
    const { name, description, pages } = dashboardStore;

    const [search, setSearch] = useState('');
    const [sortMode, setSortMode] = useState<{
        key: Exclude<keyof FlatDocumentInfo, 'description' | 'index'>;
        direction: 'ascending' | 'descending';
    }>({
        key: 'lastModifyTime',
        direction: 'descending',
    });

    const clearEditStateRef = useRef<() => void>();
    const [previewSource, setPreviewSource] = useState<{
        source: number;
        position: [number, number];
    } | null>(null);

    const columns = useMemo<(IColumn & { key: keyof FlatDocumentInfo | 'action'; fieldName?: keyof FlatDocumentInfo })[]>(() => {
        return [
            {
                key: 'source',
                name: 'source' || intl.get(''),
                fieldName: 'source',
                minWidth: 100,
                isResizable: true,
                isSorted: sortMode.key === 'source',
                isSortedDescending: sortMode.direction === 'descending',
            },
            {
                key: 'name',
                name: 'name' || intl.get(''),
                fieldName: 'name',
                minWidth: 100,
                isResizable: true,
                isSorted: sortMode.key === 'name',
                isSortedDescending: sortMode.direction === 'descending',
                onRender(item) {
                    const { operators } = dashboardStore.fromPage(item['index']);
                    return (
                        <EditableCell
                            value={item['name']}
                            placeholder="(name)"
                            onChange={operators.setName}
                            onEdit={clear => {
                                clearEditStateRef.current?.();
                                clearEditStateRef.current = clear;
                            }}
                        />
                    );
                },
            },
            {
                key: 'description',
                name: 'description' || intl.get(''),
                fieldName: 'description',
                minWidth: 200,
                isResizable: true,
                onRender(item) {
                    const { operators } = dashboardStore.fromPage(item['index']);
                    return (
                        <EditableCell
                            value={item['description']}
                            placeholder="(description)"
                            onChange={operators.setDesc}
                            onEdit={clear => {
                                clearEditStateRef.current?.();
                                clearEditStateRef.current = clear;
                            }}
                        />
                    );
                },
            },
            {
                key: 'createTime',
                name: 'createTime' || intl.get(''),
                fieldName: 'createTime',
                minWidth: 120,
                maxWidth: 120,
                isSorted: sortMode.key === 'createTime',
                isSortedDescending: sortMode.direction === 'descending',
                onRender(item) {
                    return new Date(item['createTime']).toLocaleString();
                },
            },
            {
                key: 'lastModifyTime',
                name: 'lastModifyTime' || intl.get(''),
                fieldName: 'lastModifyTime',
                minWidth: 120,
                maxWidth: 120,
                isSorted: sortMode.key === 'lastModifyTime',
                isSortedDescending: sortMode.direction === 'descending',
                onRender(item) {
                    return new Date(item['lastModifyTime']).toLocaleString();
                },
            },
            {
                key: 'action',
                name: '',
                minWidth: 96,
                onRender(item) {
                    const { operators } = dashboardStore.fromPage(item['index']);
                    return (
                        <ButtonGroup className="button-group" onClick={e => e.stopPropagation()}>
                            <IconButton iconProps={{ iconName: 'Copy' }} onClick={operators.copy} />
                            <IconButton iconProps={{ iconName: 'Download' }} onClick={operators.download} />
                            <IconButton iconProps={{ iconName: 'Delete', style: { color: '#f21044' } }} onClick={operators.remove} />
                        </ButtonGroup>
                    );
                },
            },
        ];
    }, [sortMode, dashboardStore]);

    const items = pages.map<FlatDocumentInfo>((p, i) => ({
        index: i,
        name: p.info.name,
        source: p.data.source,
        description: p.info.description,
        createTime: p.info.createTime,
        lastModifyTime: p.info.lastModifyTime,
    }));

    const sortedItems = useMemo<typeof items>(() => {
        const flag = sortMode.direction === 'descending' ? -1 : 1;
        const keywords = search.split(/\s+/).filter(Boolean).map(s => s.toLocaleLowerCase());

        return items.filter(d => {
            if (keywords.length === 0) {
                return true;
            }
            // TODO: more search logic
            return keywords.every(kw => (
                d.source.toLocaleLowerCase().includes(kw)
                || d.name.toLocaleLowerCase().includes(kw)
                || d.description.toLocaleLowerCase().includes(kw)
            ));
        }).sort((ar, br) => {
            const a = ar[sortMode.key];
            const b = br[sortMode.key];

            return flag * (typeof a === 'string' ? a.localeCompare(b as string) : a - (b as number));
        });
    }, [items, search, sortMode]);

    const toggleSort = useCallback((key: typeof sortMode.key) => {
        if (['name', 'source', 'createTime', 'lastModifyTime'].includes(key)) {
            if (key === sortMode.key) {
                setSortMode({
                    key,
                    direction: sortMode.direction === 'ascending' ? 'descending' : 'ascending',
                });
            } else {
                setSortMode({
                    key,
                    direction: sortMode.direction,
                });
            }
        }
    }, [sortMode]);

    const popupLayout = useMemo(() => {
        if (previewSource) {
            const { position, source } = previewSource;
            const size = adjustSize(pages[source].config.size);

            return {
                left: position[0],
                top: position[1],
                width: size[0],
                height: size[1],
            }
        }
        return {};
    }, [previewSource]);

    return (
        <PageLayout
            onClick={() => {
                clearEditStateRef.current?.();
                clearEditStateRef.current = undefined;
            }}
        >
            <WorkspaceView>
                <Stack>
                    <WorkspaceName>
                        <EditableCell
                            value={name}
                            onChange={n => dashboardStore.setName(n)}
                            placeholder="(dashboard list)"
                            onEdit={clear => {
                                clearEditStateRef.current?.();
                                clearEditStateRef.current = clear;
                            }}
                        />
                    </WorkspaceName>
                    <WorkspaceDesc>
                        <EditableCell
                            value={description}
                            onChange={desc => dashboardStore.setDesc(desc)}
                            placeholder="(description)"
                            onEdit={clear => {
                                clearEditStateRef.current?.();
                                clearEditStateRef.current = clear;
                            }}
                        />
                    </WorkspaceDesc>
                </Stack>
            </WorkspaceView>
            <DocumentListView>
                <div>
                    <ActionButton
                        iconProps={{ iconName: 'Add' }}
                        onClick={() => dashboardStore.newPage()}
                    >
                        New Dashboard
                    </ActionButton>
                </div>
                <div>
                    <TextField iconProps={{ iconName: 'Search' }} value={search} onChange={(_, d) => setSearch(d ?? '')} />
                </div>
                <TableContainer
                    onScroll={() => setPreviewSource(null)}
                >
                    <DetailsList
                        items={sortedItems}
                        columns={columns}
                        onColumnHeaderClick={(_, col) => col && toggleSort(col.key as typeof sortMode.key)}
                        selectionMode={SelectionMode.none}
                        onRenderRow={props => props ? (
                            <Row
                                content={props}
                                handleClick={() => clearEditStateRef.current || openDocument((props.item as FlatDocumentInfo).index)}
                                handleMouseOn={(x, y) => setPreviewSource({
                                    source: (props.item as FlatDocumentInfo).index,
                                    position: [x, y],
                                })}
                                handleMouseOut={() => setPreviewSource(null)}
                            />
                        ) : null}
                    />
                </TableContainer>
                <Layer>
                    {previewSource && (
                        <PreviewPopup
                            style={{
                                left: previewSource.position[0],
                                top: previewSource.position[1],
                                width: pages[previewSource.source].config.size.w,
                                height: pages[previewSource.source].config.size.h,
                            }}
                        >
                            <DocumentPreview index={previewSource.source} />
                        </PreviewPopup>
                    )}
                </Layer>
            </DocumentListView>
        </PageLayout>
    );
};

export default observer(DashboardList);
