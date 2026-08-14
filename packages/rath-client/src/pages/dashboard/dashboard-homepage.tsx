import intl from 'react-intl-universal';
import { observer } from 'mobx-react-lite';
import { FC, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import styled from 'styled-components';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Tabs, TabsList, TabsTrigger } from '../../components/ui/tabs';
import { RathIcon } from '../../components/icons';
import { useGlobalStore } from '../../store';
import type { DashboardDocument } from '../../store/dashboardStore';
import DashboardList from './dashboard-list';
import DashboardGallery from './dashboard-gallery';

const PageLayout = styled.div`
    flex: 1 1 auto;
    height: calc(100vh - 16px);
    min-width: 0;
    display: flex;
    flex-direction: column;
    gap: 12px;
    overflow: hidden;
    padding: 12px 32px 24px;

    @media (max-width: 720px) {
        padding-inline: 16px;
    }
`;

const Surface = styled.section`
    background-color: var(--card);
    border: 1px solid var(--border);
    border-radius: 10px;
    box-shadow: 0 1px 2px rgb(0 0 0 / 8%);
`;

const WorkspaceView = styled(Surface)`
    flex: 0 0 auto;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 24px;
    padding: 20px 24px;

    @media (max-width: 640px) {
        align-items: flex-start;
        flex-direction: column;
    }
`;

const WorkspaceCopy = styled.div`
    min-width: 0;
`;

const Eyebrow = styled.p`
    margin: 0 0 4px;
    color: var(--muted-foreground);
    font-size: 12px;
    font-weight: 600;
    letter-spacing: 0.06em;
    line-height: 1.5;
    text-transform: uppercase;
`;

const WorkspaceName = styled.h1`
    max-width: 760px;
    margin: 0;
    color: var(--foreground);
    font-size: 24px;
    font-weight: 650;
    line-height: 1.35;
`;

const WorkspaceDesc = styled.div`
    max-width: 760px;
    margin-top: 4px;
    color: var(--muted-foreground);
    font-size: 14px;
    line-height: 1.5;
`;

const Editable = styled.div`
    position: relative;
    display: flex;
    min-width: 0;
    align-items: center;
    gap: 4px;

    > span {
        min-width: 0;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
    }

    > button[type='button'] {
        flex: 0 0 auto;
        opacity: 0;
    }

    :hover > button[type='button'],
    :focus-within > button[type='button'] {
        opacity: 1;
    }
`;

const DocumentListView = styled(Surface)`
    flex: 1 1 auto;
    min-height: 0;
    display: flex;
    flex-direction: column;
    overflow: hidden;
    padding: 20px 24px;
`;

const Toolbar = styled.div`
    flex: 0 0 auto;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 16px;
    padding-bottom: 16px;
    border-bottom: 1px solid var(--border);

    @media (max-width: 640px) {
        align-items: stretch;
        flex-direction: column;
    }
`;

const SearchGroup = styled.div`
    display: flex;
    min-width: 0;
    align-items: center;
    gap: 12px;
`;

const ResultStatus = styled.span`
    flex: 0 0 auto;
    color: var(--muted-foreground);
    font-size: 12px;
    white-space: nowrap;
`;

const EmptyState = styled.div`
    flex: 1 1 auto;
    min-height: 320px;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 32px 20px;
`;

const EmptyStateContent = styled.div`
    width: min(100%, 560px);
    display: flex;
    flex-direction: column;
    align-items: center;
    text-align: center;

    h2 {
        margin: 16px 0 6px;
        color: var(--foreground);
        font-size: 20px;
        font-weight: 650;
        line-height: 1.4;
    }

    > p {
        max-width: 440px;
        margin: 0;
        color: var(--muted-foreground);
        font-size: 14px;
        line-height: 1.6;
    }
`;

const EmptyIcon = styled.div`
    width: 52px;
    height: 52px;
    display: grid;
    place-items: center;
    color: var(--primary);
    background: var(--muted);
    border: 1px solid var(--border);
    border-radius: 14px;
`;

const GettingStarted = styled.ol`
    width: 100%;
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 8px;
    margin: 24px 0 20px;
    padding: 0;
    list-style: none;
    text-align: left;

    li {
        min-width: 0;
        padding: 12px;
        color: var(--muted-foreground);
        background: var(--muted);
        border-radius: 8px;
        font-size: 12px;
        line-height: 1.5;
    }

    strong {
        display: block;
        margin-bottom: 2px;
        color: var(--foreground);
        font-size: 13px;
        font-weight: 600;
    }

    @media (max-width: 560px) {
        grid-template-columns: 1fr;
    }
`;

let clearActiveEditableCell = () => {};

export const EditableCell: FC<{
    value: string;
    placeholder: string;
    onChange: (value: string) => void;
    editLabel?: string;
}> = ({ value, onChange, placeholder, editLabel = 'Edit' }) => {
    const [isEditing, setEditing] = useState(false);
    const [data, setData] = useState(value);
    const cancelEditRef = useRef(false);

    useEffect(() => {
        setData(value);
    }, [value]);

    useEffect(() => {
        if (!isEditing) {
            cancelEditRef.current = false;
            return;
        }
        clearActiveEditableCell();
        clearActiveEditableCell = () => setEditing(false);
    }, [isEditing]);

    const finishEditing = useCallback(
        (nextValue: string) => {
            if (!cancelEditRef.current && nextValue !== value) {
                setData(nextValue);
                onChange(nextValue);
            } else if (cancelEditRef.current) {
                setData(value);
            }
            cancelEditRef.current = false;
            setEditing(false);
            clearActiveEditableCell = () => {};
        },
        [onChange, value]
    );

    const startEditing = useCallback(() => {
        cancelEditRef.current = false;
        setData(value);
        setEditing(true);
    }, [value]);

    const cancelEditing = useCallback((input: HTMLInputElement) => {
        cancelEditRef.current = true;
        input.blur();
    }, []);

    return (
        <Editable>
            {isEditing ? (
                <Input
                    value={data}
                    aria-label={editLabel}
                    onChange={(e) => setData(e.target.value)}
                    autoFocus
                    onBlur={(event) => finishEditing(event.currentTarget.value)}
                    onClick={(e) => e.stopPropagation()}
                    onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                            e.currentTarget.blur();
                        } else if (e.key === 'Escape') {
                            setData(value);
                            cancelEditing(e.currentTarget);
                        }
                    }}
                />
            ) : (
                <span>{data || placeholder}</span>
            )}
            {isEditing ? null : (
                <Button
                    variant="ghost"
                    size="icon"
                    aria-label={editLabel}
                    onClick={(e) => {
                        e.stopPropagation();
                        startEditing();
                    }}
                >
                    <RathIcon name="Edit" />
                </Button>
            )}
        </Editable>
    );
};

export interface DashboardPageItem {
    index: number;
    page: DashboardDocument;
}

export interface DashboardHomepageProps {
    openDocument: (index: number) => void;
}

const VIEW_MODES = [
    { key: 'list', icon: 'BulletedList' },
    { key: 'gallery', icon: 'PhotoCollection' },
] as const;

type ViewMode = typeof VIEW_MODES[number]['key'];

const DashboardHomepage: FC<DashboardHomepageProps> = ({ openDocument }) => {
    const { dashboardStore } = useGlobalStore();
    const { name, description, pages } = dashboardStore;
    const [search, setSearch] = useState('');
    const [viewMode, setViewMode] = useState<ViewMode>('list');

    const DashboardView = useMemo(
        () =>
            ({
                list: DashboardList,
                gallery: DashboardGallery,
            }[viewMode]),
        [viewMode]
    );

    const keywords = search
        .trim()
        .split(/\s+/)
        .filter(Boolean)
        .map((keyword) => keyword.toLocaleLowerCase());
    const filteredPages = pages.reduce<DashboardPageItem[]>((result, page, index) => {
        const searchableText = `${page.data.source} ${page.info.name} ${page.info.description}`.toLocaleLowerCase();
        if (keywords.every((keyword) => searchableText.includes(keyword))) {
            result.push({ index, page });
        }
        return result;
    }, []);
    const hasPages = pages.length > 0;
    const hasSearch = search.trim().length > 0;

    const createDashboard = useCallback(() => {
        const index = dashboardStore.pages.length;
        dashboardStore.newPage();
        openDocument(index);
    }, [dashboardStore, openDocument]);

    return (
        <PageLayout onClick={clearActiveEditableCell}>
            <WorkspaceView aria-labelledby="dashboard-workspace-name">
                <WorkspaceCopy>
                    <Eyebrow>Dashboard workspace</Eyebrow>
                    <WorkspaceName id="dashboard-workspace-name" aria-label={name || 'My dashboard list'}>
                        <EditableCell
                            value={name}
                            onChange={(nextName) => dashboardStore.setName(nextName)}
                            placeholder="My dashboard list"
                            editLabel="Edit workspace name"
                        />
                    </WorkspaceName>
                    <WorkspaceDesc>
                        <EditableCell
                            value={description}
                            onChange={(nextDescription) => dashboardStore.setDesc(nextDescription)}
                            placeholder="Add a description to help others understand this workspace"
                            editLabel="Edit workspace description"
                        />
                    </WorkspaceDesc>
                </WorkspaceCopy>
                <Button size="lg" onClick={createDashboard}>
                    <RathIcon name="Add" className="mr-1.5" />
                    New Dashboard
                </Button>
            </WorkspaceView>

            <DocumentListView aria-label="Dashboards">
                {hasPages ? (
                    <>
                        <Toolbar>
                            <SearchGroup>
                                <div className="relative w-full max-w-sm">
                                    <RathIcon
                                        className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground"
                                        name="Search"
                                    />
                                    <Input
                                        className="pl-8 pr-8"
                                        value={search}
                                        aria-label="Search dashboards"
                                        placeholder="Search dashboards"
                                        onChange={(event) => setSearch(event.target.value)}
                                    />
                                    {hasSearch ? (
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="absolute right-0.5 top-1/2 h-7 w-7 -translate-y-1/2"
                                            aria-label="Clear search"
                                            onClick={() => setSearch('')}
                                        >
                                            <RathIcon name="ChromeClose" />
                                        </Button>
                                    ) : null}
                                </div>
                                <ResultStatus aria-live="polite">
                                    {hasSearch
                                        ? `${filteredPages.length} of ${pages.length}`
                                        : `${pages.length} dashboard${pages.length === 1 ? '' : 's'}`}
                                </ResultStatus>
                            </SearchGroup>
                            <Tabs value={viewMode} onValueChange={(value) => setViewMode(value as ViewMode)}>
                                <TabsList aria-label="Dashboard view">
                                    {VIEW_MODES.map((mode) => (
                                        <TabsTrigger key={mode.key} value={mode.key}>
                                            <RathIcon name={mode.icon} className="mr-1.5" />
                                            {intl.get(`common.${mode.key}`)}
                                        </TabsTrigger>
                                    ))}
                                </TabsList>
                            </Tabs>
                        </Toolbar>

                        {filteredPages.length > 0 ? (
                            <DashboardView openDocument={openDocument} pages={filteredPages} />
                        ) : (
                            <EmptyState>
                                <EmptyStateContent role="status">
                                    <EmptyIcon>
                                        <RathIcon name="SearchIssue" size={24} />
                                    </EmptyIcon>
                                    <h2>No dashboards found</h2>
                                    <p>Try a different name, description, or data source.</p>
                                    <Button variant="outline" className="mt-5" onClick={() => setSearch('')}>
                                        Clear search
                                    </Button>
                                </EmptyStateContent>
                            </EmptyState>
                        )}
                    </>
                ) : (
                    <EmptyState>
                        <EmptyStateContent>
                            <EmptyIcon>
                                <RathIcon name="Presentation" size={26} />
                            </EmptyIcon>
                            <h2>Create your first dashboard</h2>
                            <p>Turn the current dataset into a clear, shareable story. Start with a blank canvas and build at your own pace.</p>
                            <GettingStarted aria-label="How dashboards work">
                                <li>
                                    <strong>1. Create</strong>
                                    Open a new dashboard canvas.
                                </li>
                                <li>
                                    <strong>2. Add content</strong>
                                    Place charts, titles, and notes.
                                </li>
                                <li>
                                    <strong>3. Refine</strong>
                                    Arrange the layout and preview it.
                                </li>
                            </GettingStarted>
                            <Button size="lg" onClick={createDashboard}>
                                <RathIcon name="Add" className="mr-1.5" />
                                Create Dashboard
                            </Button>
                        </EmptyStateContent>
                    </EmptyState>
                )}
            </DocumentListView>
        </PageLayout>
    );
};

export default observer(DashboardHomepage);
