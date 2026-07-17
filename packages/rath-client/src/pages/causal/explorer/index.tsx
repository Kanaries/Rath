import intl from 'react-intl-universal';
import { observer } from 'mobx-react-lite';
import { FC, useCallback, useEffect, useRef, useState } from 'react';
import styled from 'styled-components';
import { cn } from 'utils/cn';
import { Button } from '../../../components/ui/button';
import { Label } from '../../../components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '../../../components/ui/popover';
import { Separator } from '../../../components/ui/separator';
import { Slider } from '../../../components/ui/slider';
import { RathIcon } from '../../../components/icons';
import type { IFieldMeta } from '../../../interfaces';
import { useGlobalStore } from '../../../store';
import type { EdgeAssert } from '../../../store/causalStore/modelStore';
import { useCausalViewContext } from '../../../store/causalStore/viewStore';
import type { Subtree } from '../exploration';
import ExplorerMainView from './explorerMainView';

export type CausalNode = {
    nodeId: number;
    fid: string;
};

export type CausalLink = {
    causeId: number;
    effectId: number;
    score: number;
    type: 'directed' | 'bidirected' | 'undirected' | 'weak directed' | 'weak undirected';
};

export interface ExplorerProps {
    allowEdit: boolean;
    onLinkTogether: (srcFid: string, tarFid: string, type: EdgeAssert) => void;
    onRevertLink: (srcFid: string, tarFid: string) => void;
    onRemoveLink: (srcFid: string, tarFid: string) => void;
    handleLasso?: (fields: IFieldMeta[]) => void;
    handleSubTreeSelected?: (subtree: Subtree | null) => void;
}

const Container = styled.div`
    width: 100%;
    height: 100%;
    position: relative;
    overflow: hidden;
    > .main-view {
        position: absolute;
        inset: 0;
    }
`;

const LegendLine = styled.span<{ dashed?: boolean }>`
    display: inline-block;
    width: 18px;
    border-top: 2px ${({ dashed }) => (dashed ? 'dashed' : 'solid')} #f6bd16;
    opacity: ${({ dashed }) => (dashed ? 0.7 : 1)};
`;

const ToolButton: FC<{
    icon: string;
    label: string;
    pressed?: boolean;
    onClick?: () => void;
}> = ({ icon, label, pressed, onClick }) => (
    <Button
        variant="ghost"
        size="icon"
        className={cn('h-7 w-7 text-muted-foreground hover:text-foreground', pressed && 'bg-accent text-accent-foreground')}
        title={label}
        aria-label={label}
        aria-pressed={pressed}
        onClick={onClick}
    >
        <RathIcon name={icon} size={14} />
    </Button>
);

const Explorer: FC<ExplorerProps> = ({ allowEdit, onLinkTogether, onRevertLink, onRemoveLink, handleLasso, handleSubTreeSelected }) => {
    const { causalStore } = useGlobalStore();
    const { causality } = causalStore.model;

    const [cutThreshold] = useState(0);
    const [mode, setMode] = useState<'explore' | 'edit'>('explore');

    const [allowZoom, setAllowZoom] = useState(false);

    const viewContext = useCausalViewContext();

    const handleClickCircle = useCallback(
        (fid: string | null) => {
            if (fid === null) {
                return viewContext?.clearSelected();
            }
            if (mode === 'explore') {
                viewContext?.toggleNodeSelected(fid);
            }
        },
        [mode, viewContext]
    );

    const forceRelayoutRef = useRef<() => void>(() => {});

    useEffect(() => {
        viewContext?.clearSelected();
    }, [mode, viewContext]);

    const [limit, setLimit] = useState(20);

    const forceLayout = useCallback(() => {
        forceRelayoutRef.current();
    }, []);

    useEffect(() => {
        setMode('explore');
    }, [allowEdit]);

    const totalEdges = (causality ?? []).length;
    const shownEdges = Math.min(limit, totalEdges);

    return (
        <Container>
            <div className="main-view">
                <ExplorerMainView
                    forceRelayoutRef={forceRelayoutRef}
                    limit={limit}
                    mode={mode}
                    cutThreshold={cutThreshold}
                    onClickNode={handleClickCircle}
                    onLinkTogether={onLinkTogether}
                    onRevertLink={onRevertLink}
                    onRemoveLink={onRemoveLink}
                    allowZoom={allowZoom}
                    handleLasso={handleLasso}
                    handleSubTreeSelected={handleSubTreeSelected}
                    style={{
                        width: '100%',
                        height: '100%',
                    }}
                />
            </div>
            <div
                role="toolbar"
                aria-label={intl.get('causal.analyze.canvas_tools')}
                className="absolute right-2.5 top-2.5 flex items-center gap-0.5 rounded-lg border bg-background p-0.5 shadow-sm"
            >
                <ToolButton icon="Refresh" label={intl.get('causal.actions.relayout')} onClick={forceLayout} />
                <ToolButton
                    icon="Search"
                    label={intl.get('causal.actions.zoom_canvas')}
                    pressed={allowZoom}
                    onClick={() => setAllowZoom((v) => !v)}
                />
                {allowEdit && (
                    <>
                        <Separator orientation="vertical" className="mx-0.5 h-4" />
                        <ToolButton
                            icon="Edit"
                            label={intl.get('causal.actions.modify_constraints')}
                            pressed={mode === 'edit'}
                            onClick={() => setMode((m) => (m === 'edit' ? 'explore' : 'edit'))}
                        />
                    </>
                )}
                <Popover>
                    <PopoverTrigger asChild>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-muted-foreground hover:text-foreground"
                            title={intl.get('causal.actions.display_limit')}
                            aria-label={intl.get('causal.actions.display_limit')}
                        >
                            <RathIcon name="BulletedList" size={14} />
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent align="end" className="w-64">
                        <div className="grid gap-2">
                            <div className="flex items-center justify-between gap-4">
                                <Label>{intl.get('causal.actions.display_limit')}</Label>
                                <span className="text-sm text-muted-foreground">{limit}</span>
                            </div>
                            <Slider
                                min={1}
                                max={Math.max(totalEdges, limit, 10)}
                                value={[limit]}
                                onValueChange={(value) => setLimit(value[0])}
                            />
                        </div>
                    </PopoverContent>
                </Popover>
            </div>
            <div className="absolute bottom-2.5 left-2.5 flex items-center gap-3.5 rounded-lg border bg-background/85 px-3 py-1.5 text-[11px] text-muted-foreground backdrop-blur-sm">
                <span className="inline-flex items-center gap-1.5">
                    <LegendLine /> {intl.get('causal.legend.directed')}
                </span>
                <span className="inline-flex items-center gap-1.5">
                    <LegendLine dashed /> {intl.get('causal.legend.undirected')}
                </span>
                <span className="text-muted-foreground/70">
                    {intl.get('causal.legend.edges', { shown: shownEdges, total: totalEdges })}
                </span>
                {mode === 'edit' && <span className="font-medium text-primary">{intl.get('causal.actions.modify_constraints')}</span>}
            </div>
        </Container>
    );
};

export default observer(Explorer);
