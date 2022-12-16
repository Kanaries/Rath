import { DefaultButton, Dropdown, Icon, SpinButton, Stack, Toggle } from "@fluentui/react";
import { observer } from "mobx-react-lite";
import { FC, useCallback, useEffect, useRef, useState } from "react";
import styled from "styled-components";
import type { IFieldMeta } from "../../../interfaces";
import { getGlobalStore/*, useGlobalStore*/ } from "../../../store";
import type { EdgeAssert } from "../../../store/causalStore/modelStore";
import { LayoutMethod, LayoutMethods, useCausalViewContext } from "../../../store/causalStore/viewStore";
import type { Subtree } from "../submodule";
import { getI18n } from "../locales";
import GraphView from "./graphView";
import Floating from "./floating";


export type CausalNode = {
    nodeId: number;
    fid: string;
}

export type CausalLink = {
    causeId: number;
    effectId: number;
    score: number;
    type: 'directed' | 'bidirected' | 'undirected' | 'weak directed' | 'weak undirected';
}

export interface ExplorerProps {
    allowEdit: boolean;
    onLinkTogether: (srcFid: string, tarFid: string, type: EdgeAssert) => void;
    onRevertLink: (srcFid: string, tarFid: string) => void;
    onRemoveLink: (srcFid: string, tarFid: string) => void;
    handleLasso?: (fields: IFieldMeta[]) => void;
    handleSubTreeSelected?: (subtree: Subtree | null) => void;
}

const Container = styled.div`
    margin-top: 2em;
    width: 100%;
    display: flex;
    flex-direction: column;
    align-items: stretch;
    position: relative;
    overflow: hidden;
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
    overflow: hidden;
    display: flex;
    flex-direction: row;
    align-items: stretch;
    justify-content: stretch;
    border: 1px solid #e3e2e2;
    > * {
        height: 100%;
        flex-grow: 1;
        flex-shrink: 1;
    }
`;

const Explorer: FC<ExplorerProps> = ({
    allowEdit,
    onLinkTogether,
    onRevertLink,
    onRemoveLink,
    handleLasso,
    handleSubTreeSelected,
}) => {
    const [cThreshold, setCThreshold] = useState(0.9);
    const [wThreshold, setWThreshold] = useState(0.2);
    const [mode, setMode] = useState<'explore' | 'edit'>('explore');
    
    const [allowZoom, setAllowZoom] = useState(false);
    
    const viewContext = useCausalViewContext();

    const handleClickCircle = useCallback((fid: string | null) => {
        if (fid === null) {
            return viewContext?.clearSelected();
        } else {
            const f = getGlobalStore().causalStore.dataset.allFields.find(which => which.fid === fid);
            if (f) {
                viewContext?.fireEvent('nodeClick', f);
            }
        }
        if (mode === 'explore') {
            viewContext?.toggleNodeSelected(fid);
        }
    }, [mode, viewContext]);

    const forceRelayoutRef = useRef<() => void>(() => {});

    useEffect(() => {
        viewContext?.clearSelected();
    }, [mode, viewContext]);

    const forceLayout = useCallback(() => {
        forceRelayoutRef.current();
    }, []);

    useEffect(() => {
        setMode('explore');
    }, [allowEdit]);

    return (
        <Container>
            {viewContext && (
                <Stack style={{ margin: '0 0 0.6em' }} horizontal >
                    <Dropdown
                        selectedKey={viewContext.layoutMethod}
                        options={LayoutMethods.map(key => ({ key, text: getI18n(`chart.layout.${key}`) }))}
                        style={{ minWidth: '6em' }}
                        onChange={(_, opt) => {
                            if (opt?.key) {
                                viewContext.setLayout(opt.key as LayoutMethod);
                            }
                        }}
                    />
                    <DefaultButton
                        style={{
                            flexGrow: 0,
                            flexShrink: 0,
                            flexBasis: 'max-content',
                            padding: '0.4em 0',
                        }}
                        iconProps={{ iconName: 'Play' }}
                        onClick={forceLayout}
                    >
                        {getI18n('chart.re_layout')}
                    </DefaultButton>
                </Stack>
            )}
            <MainView>
                <GraphView
                    forceRelayoutRef={forceRelayoutRef}
                    mode={mode}
                    weightThreshold={wThreshold}
                    confThreshold={cThreshold}
                    onClickNode={handleClickCircle}
                    onLinkTogether={onLinkTogether}
                    onRevertLink={onRevertLink}
                    onRemoveLink={onRemoveLink}
                    allowZoom={allowZoom}
                    handleLasso={handleLasso}
                    handleSubtreeSelected={handleSubTreeSelected}
                    style={{
                        flexGrow: 1,
                        flexShrink: 1,
                        width: '100%',
                    }}
                />
            </MainView>
            <Floating position="absolute" direction="start" onRenderAside={() => (<Icon iconName="Waffle" />)}>
                <Tools>
                    <Toggle
                        label={getI18n('chart.tools.resize')}
                        checked={allowZoom}
                        onChange={(_, checked) => setAllowZoom(Boolean(checked))}
                        onText="On"
                        offText="Off"
                        inlineLabel
                    />
                    {allowEdit && (
                        <Toggle
                            label={getI18n('chart.tools.write')}
                            checked={mode === 'edit'}
                            onChange={(_, checked) => setMode(checked ? 'edit' : 'explore')}
                            onText="On"
                            offText="Off"
                            inlineLabel
                        />
                    )}
                    <SpinButton
                        label={getI18n('chart.tools.filter_by_confidence')}
                        min={0}
                        max={1}
                        step={1e-3}
                        value={`${cThreshold}`}
                        onChange={(_, d) => setCThreshold(Number(d))}
                    />
                    <SpinButton
                        label={getI18n('chart.tools.filter_by_weight')}
                        min={0}
                        max={1}
                        step={1e-3}
                        value={`${wThreshold}`}
                        onChange={(_, d) => setWThreshold(Number(d))}
                    />
                </Tools>
            </Floating>
        </Container>
    );
};


export default observer(Explorer);
