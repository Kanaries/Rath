import intl from 'react-intl-universal';
import { observer } from 'mobx-react-lite';
import { FC, useCallback, useEffect, useRef, useState } from 'react';
import styled from 'styled-components';
import { Button } from '../../../components/ui/button';
import { Label } from '../../../components/ui/label';
import { Slider } from '../../../components/ui/slider';
import { Switch } from '../../../components/ui/switch';
import { RathIcon } from '../../../components/icons';
import type { IFieldMeta } from '../../../interfaces';
import { useGlobalStore } from '../../../store';
import type { EdgeAssert } from '../../../store/causalStore/modelStore';
import { useCausalViewContext } from '../../../store/causalStore/viewStore';
import type { Subtree } from '../exploration';
import Floating from '../floating';
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
    display: flex;
    flex-direction: column;
    align-items: stretch;
    position: relative;
`;

const Tools = styled.div`
    width: 250px;
    flex-grow: 0;
    flex-shrink: 0;
    display: flex;
    flex-direction: column;
    padding: 1em 1em;
    align-items: flex-start;
    user-select: none;
    > * {
        flex-grow: 0;
        flex-shrink: 0;
        margin: 0.3em 0;
    }
    > *:not(:first-child) {
        width: 100%;
    }
`;

const MainView = styled.div`
    flex-grow: 1;
    flex-shrink: 1;
    /* height: 46vh; */
    overflow: hidden;
    display: flex;
    flex-direction: row;
    align-items: stretch;
    justify-content: stretch;
    border: 1px solid #e3e2e2;
    /* padding: 1em; */
    > * {
        height: 100%;
        flex-grow: 1;
        flex-shrink: 1;
    }
`;

const Explorer: FC<ExplorerProps> = ({ allowEdit, onLinkTogether, onRevertLink, onRemoveLink, handleLasso, handleSubTreeSelected }) => {
    const { causalStore } = useGlobalStore();
    const { causality } = causalStore.model;

    const [cutThreshold, setCutThreshold] = useState(0);
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

    return (
        <Container>
            <div style={{ display: 'flex', margin: '0 0 0.6em' }}>
                <Button
                    variant="outline"
                    style={{
                        flexGrow: 0,
                        flexShrink: 0,
                        flexBasis: 'max-content',
                        padding: '0.4em 0',
                    }}
                    onClick={forceLayout}
                >
                    <RathIcon name="Play" />
                    {intl.get('causal.actions.relayout')}
                </Button>
            </div>
            <MainView>
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
            </MainView>
            <Floating position="absolute" direction="start" onRenderAside={() => <RathIcon name="Waffle" />}>
                <Tools>
                    <div className="flex items-center justify-between gap-4">
                        <Label htmlFor="causal-zoom-canvas">{intl.get('causal.actions.zoom_canvas')}</Label>
                        <Switch id="causal-zoom-canvas" checked={allowZoom} onCheckedChange={(checked) => setAllowZoom(Boolean(checked))} />
                    </div>
                    {allowEdit && (
                        <div className="flex items-center justify-between gap-4">
                            <Label htmlFor="causal-modify-constraints">{intl.get('causal.actions.modify_constraints')}</Label>
                            <Switch
                                id="causal-modify-constraints"
                                checked={mode === 'edit'}
                                onCheckedChange={(checked) => setMode(checked ? 'edit' : 'explore')}
                            />
                        </div>
                    )}
                    <div className="grid gap-2">
                        <div className="flex items-center justify-between gap-4">
                            <Label>{intl.get('causal.actions.display_limit')}</Label>
                            <span className="text-sm text-muted-foreground">{limit}</span>
                        </div>
                        <Slider
                            min={1}
                            max={Math.max((causality ?? []).length, limit, 10)}
                            value={[limit]}
                            onValueChange={(value) => setLimit(value[0])}
                        />
                    </div>
                    {/* TODO: 现在没有有意义的权重，暂时隐藏 */}
                    {false && (
                        <div className="grid gap-2">
                            <div className="flex items-center justify-between gap-4">
                                <Label>{intl.get('causal.actions.filter_by_weights')}</Label>
                                <span className="text-sm text-muted-foreground">{cutThreshold}</span>
                            </div>
                            <Slider min={0} max={1} step={0.01} value={[cutThreshold]} onValueChange={(d) => setCutThreshold(d[0])} />
                        </div>
                    )}
                </Tools>
            </Floating>
        </Container>
    );
};

export default observer(Explorer);
