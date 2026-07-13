import intl from 'react-intl-universal';
import { observer } from 'mobx-react-lite';
import { FC, useEffect, useMemo, useState } from 'react';
import styled from 'styled-components';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Tabs, TabsList, TabsTrigger } from '../../components/ui/tabs';
import { RathIcon } from '../../components/icons';
import { useGlobalStore } from '../../store';
import DashboardList from './dashboard-list';
import dashboardGallery from './dashboard-gallery';

const PageLayout = styled.div`
    flex-grow: 1;
    flex-shrink: 1;
    height: calc(100vh - 16px);
    display: flex;
    flex-direction: column;
    overflow: hidden;
    > div {
        background-color: var(--card);
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
    color: var(--muted-foreground);
    position: relative;
`;

const Editable = styled.div`
    > button[type='button'] {
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
    :hover > button[type='button'] {
        opacity: 1;
    }
`;

let clearActiveEditableCell = () => {};

export const EditableCell: FC<{ value: string; placeholder: string; onChange: (value: string) => void }> = ({ value, onChange, placeholder }) => {
    const [isEditing, setEditing] = useState(false);
    const [data, setData] = useState('');

    useEffect(() => {
        if (isEditing) {
            clearActiveEditableCell();
            clearActiveEditableCell = () => setEditing(false);
        }
        setData(value);
    }, [value, isEditing]);

    useEffect(() => {
        setEditing(false);
    }, [value]);

    return (
        <Editable>
            {isEditing ? (
                <Input
                    value={data}
                    onChange={(e) => setData(e.target.value)}
                    autoFocus
                    onClick={(e) => e.stopPropagation()}
                    onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                            const d = data;
                            requestAnimationFrame(() => onChange(d));
                            setEditing(false);
                            clearActiveEditableCell = () => {};
                        } else if (e.key === 'Escape') {
                            setEditing(false);
                            clearActiveEditableCell = () => {};
                        }
                    }}
                />
            ) : (
                <span>{value || placeholder}</span>
            )}
            {isEditing || (
                <Button
                    variant="ghost"
                    size="icon"
                    aria-label="Edit"
                    autoFocus
                    onClick={(e) => {
                        e.stopPropagation();
                        setEditing(true);
                    }}
                >
                    <RathIcon name="Edit" />
                </Button>
            )}
        </Editable>
    );
};

export interface DashboardHomepageProps {
    openDocument: (index: number) => void;
}

const VIEW_MODES = [
    { key: 'list', icon: 'Table' },
    { key: 'gallery', icon: 'Table' },
] as const;

type ViewMode = typeof VIEW_MODES[number]['key'];

const DashboardHomepage: FC<DashboardHomepageProps> = ({ openDocument }) => {
    const { dashboardStore } = useGlobalStore();
    const { name, description, pages } = dashboardStore;

    const [search, setSearch] = useState('');

    const [viewMode, setViewMode] = useState<ViewMode>('list');

    const List = useMemo(
        () =>
            ({
                list: DashboardList,
                gallery: dashboardGallery,
            }[viewMode]),
        [viewMode]
    );

    const keywords = search
        .split(/\s+/)
        .filter(Boolean)
        .map((s) => s.toLocaleLowerCase());
    const filteredPages = pages.filter((d) => {
        if (keywords.length === 0) {
            return true;
        }
        // TODO: more search logic
        return keywords.every(
            (kw) =>
                d.data.source.toLocaleLowerCase().includes(kw) ||
                d.info.name.toLocaleLowerCase().includes(kw) ||
                d.info.description.toLocaleLowerCase().includes(kw)
        );
    });

    return (
        <PageLayout onClick={clearActiveEditableCell}>
            <WorkspaceView>
                <div>
                    <WorkspaceName>
                        <EditableCell value={name} onChange={(n) => dashboardStore.setName(n)} placeholder="(dashboard list)" />
                    </WorkspaceName>
                    <WorkspaceDesc>
                        <EditableCell value={description} onChange={(desc) => dashboardStore.setDesc(desc)} placeholder="(description)" />
                    </WorkspaceDesc>
                </div>
            </WorkspaceView>
            <DocumentListView>
                <div>
                    <Button variant="ghost" onClick={() => dashboardStore.newPage()}>
                        <RathIcon name="Add" />
                        New Dashboard
                    </Button>
                </div>
                <div>
                    <div className="relative max-w-xs">
                        <RathIcon className="absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground" name="Search" />
                        <Input className="pl-8" value={search} onChange={(e) => setSearch(e.target.value)} />
                    </div>
                </div>
                <Tabs value={viewMode} onValueChange={(value) => setViewMode(value as ViewMode)} className="my-4">
                    <TabsList>
                        {VIEW_MODES.map((mode) => (
                            <TabsTrigger key={mode.key} value={mode.key}>
                                <RathIcon name={mode.icon} className="mr-1" />
                                {intl.get(`common.${mode.key}`)}
                            </TabsTrigger>
                        ))}
                    </TabsList>
                </Tabs>
                <List openDocument={openDocument} pages={filteredPages} />
            </DocumentListView>
        </PageLayout>
    );
};

export default observer(DashboardHomepage);
