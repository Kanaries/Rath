import { DefaultButton, Dropdown, Icon, SpinButton, Stack, Toggle } from "@fluentui/react";
import { observer } from "mobx-react-lite";
import { FC, useCallback, useEffect, useRef, useState } from "react";
import styled from "styled-components";
import type { IFieldMeta } from "../../../interfaces";
import { getGlobalStore/*, useGlobalStore*/ } from "../../../store";
import type { EdgeAssert } from "../../../store/causalStore/modelStore";
import { useCausalViewContext } from "../../../store/causalStore/viewStore";
import type { Subtree } from "../exploration";
import Floating from "../floating";
import ExplorerMainView from "./explorerMainView";


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

const Explorer: FC<ExplorerProps> = ({
    allowEdit,
    onLinkTogether,
    onRevertLink,
    onRemoveLink,
    handleLasso,
    handleSubTreeSelected,
}) => {
    // const { causalStore } = useGlobalStore();
    // const { causality } = causalStore.model;

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

    // const [limit, setLimit] = useState(20);

    const forceLayout = useCallback(() => {
        forceRelayoutRef.current();
    }, []);

    useEffect(() => {
        setMode('explore');
    }, [allowEdit]);

    const [s, ss] = useState('force');

    return (
        <Container>
            <Stack style={{ margin: '0 0 0.6em' }} horizontal >
                {/* <DefaultButton
                    style={{
                        flexGrow: 0,
                        flexShrink: 0,
                        flexBasis: 'max-content',
                        padding: '0.4em 0',
                    }}
                    iconProps={{ iconName: 'Play' }}
                    onClick={forceLayout}
                >
                    重新布局
                </DefaultButton> */}
                <Dropdown
                    selectedKey={s}
                    options={[
                        { key: 'force', text: '力引导布局' },
                        { key: 'circular', text: '环形布局' },
                        { key: 'radial', text: '辐射布局' },
                        { key: 'grid', text: '网格布局' },
                    ]}
                    style={{ minWidth: '6em' }}
                    onChange={(_, opt) => {
                        opt?.key && ss(opt.key as string);
                        setTimeout(() => forceLayout(), 100);
                    }}
                />
            </Stack>
            <MainView>
                <ExplorerMainView
                    forceRelayoutRef={forceRelayoutRef}
                    // limit={limit}
                    mode={mode}
                    weightThreshold={wThreshold}
                    confThreshold={cThreshold}
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
            <Floating position="absolute" direction="start" onRenderAside={() => (<Icon iconName="Waffle" />)}>
                <Tools>
                    <Toggle
                        label="画布缩放"
                        checked={allowZoom}
                        onChange={(_, checked) => setAllowZoom(Boolean(checked))}
                        onText="On"
                        offText="Off"
                        inlineLabel
                    />
                    {allowEdit && (
                        <Toggle
                            // label="Modify Constraints"
                            label="编辑因果关系"
                            checked={mode === 'edit'}
                            onChange={(_, checked) => setMode(checked ? 'edit' : 'explore')}
                            onText="On"
                            offText="Off"
                            inlineLabel
                        />
                    )}
                    {/* <Slider
                        // label="Display Limit"
                        label="边显示上限"
                        min={1}
                        max={Math.max((causality ?? []).length, limit, 10)}
                        value={limit}
                        onChange={value => setLimit(value)}
                    /> */}
                    <SpinButton
                        label="按置信度筛选"
                        min={0}
                        max={1}
                        step={1e-3}
                        value={`${cThreshold}`}
                        onChange={(_, d) => setCThreshold(Number(d))}
                    />
                    <SpinButton
                        label="按权重筛选"
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
