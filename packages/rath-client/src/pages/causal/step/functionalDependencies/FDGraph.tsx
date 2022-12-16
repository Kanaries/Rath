import { observer } from 'mobx-react-lite';
import { FC, useCallback, useEffect, useRef, useState } from 'react';
import type { Graph } from '@antv/g6';
import { DefaultButton } from '@fluentui/react';
import styled from 'styled-components';
import produce from 'immer';
import { useGlobalStore } from '../../../../store';
import { useRenderData, useGraphOptions } from '../../explorer/graph-utils';
import { useReactiveGraph } from '../../explorer/graph-helper';
import { transformFuncDepsToPag } from '../../../../store/causalStore/pag';
import type { IFunctionalDep } from '../../config';
import { getI18n } from '../../locales';


const Container = styled.div`
    height: 600px;
    position: relative;
    > div:first-child {
        width: 100%;
        height: 100%;
    }
    > .tools {
        position: absolute;
        left: 0;
        top: 0;
        padding: 1em;
        flex-grow: 0;
        flex-shrink: 0;
        flex-basis: max-content;
        font-size: 0.8rem;
        opacity: 0.7;
        :hover {
            opacity: 0.95;
        }
    }
`;

const FDGraph: FC<{
    functionalDependencies: readonly IFunctionalDep[];
    setFunctionalDependencies: (fdArr: IFunctionalDep[] | ((prev: readonly IFunctionalDep[] | null) => readonly IFunctionalDep[])) => void;
}> = ({
    functionalDependencies,
    setFunctionalDependencies,
}) => {
    const { causalStore } = useGlobalStore();
    const { fields, groups } = causalStore.dataset;
    const functionalDependenciesAsPag = transformFuncDepsToPag(functionalDependencies);

    const containerRef = useRef<HTMLDivElement>(null);
    const [width, setWidth] = useState(0);

    const onLinkTogether = useCallback((srcFid: string, tarFid: string) => {
        if ([srcFid, tarFid].some(fid => groups.some(grp => grp.root === fid))) {
            return;
        }
        const group = groups.find(grp => grp.children.includes(srcFid));
        if (group?.children.includes(tarFid)) {
            return;
        }
        setFunctionalDependencies(list => produce(list ?? [], draft => {
            const linked = draft.find(fd => fd.fid === tarFid);
            if (linked && !linked.params.some(prm => prm.fid === srcFid)) {
                linked.params.push({ fid: srcFid });
                if (!linked.func) {
                    linked.func = '<user-defined>';
                } else if (linked.func !== '<user-defined>') {
                    linked.func = '<mixed>';
                }
            } else {
                draft.push({
                    fid: tarFid,
                    params: [{
                        fid: srcFid,
                    }],
                    func: '<user-defined>',
                });
            }
        }));
    }, [setFunctionalDependencies, groups]);

    const onRemoveLink = useCallback((edge: { srcFid: string; tarFid: string; } | null) => {
        if (edge) {
            setFunctionalDependencies(list => produce(list ?? [], draft => {
                const linkedIdx = draft.findIndex(fd => fd.fid === edge.tarFid && fd.params.some(prm => prm.fid === edge.srcFid));
                if (linkedIdx !== -1) {
                    const linked = draft[linkedIdx];
                    if (linked.params.length > 1) {
                        linked.params = linked.params.filter(prm => prm.fid !== edge.srcFid);
                        if (linked.func !== '<user-defined>') {
                            linked.func = '<mixed>';
                        }
                    } else {
                        draft.splice(linkedIdx, 1);
                    }
                }
            }));
        }
    }, [setFunctionalDependencies]);

    const graphRef = useRef<Graph>();
    const renderData = useRenderData({
        mode: 'edit',
        PAG: functionalDependenciesAsPag,
    });
    const cfg = useGraphOptions({
        width,
        handleLink: onLinkTogether,
        graphRef,
    });
    const cfgRef = useRef(cfg);
    cfgRef.current = cfg;

    const handleNodeDblClick = useCallback((fid: string | null) => {
        const f = fields.find(which => which.fid === fid);
        if (f) {
            causalStore.dataset.toggleExpand(f);
        }
    }, [causalStore.dataset, fields]);

    const graph = useReactiveGraph({
        containerRef,
        width,
        graphRef,
        options: cfg,
        data: renderData,
        mode: 'edit',
        handleEdgeClick: onRemoveLink,
        handleNodeDblClick,
        allowZoom: false,
    });

    useEffect(() => {
        const { current: container } = containerRef;
        if (container) {
            const cb = () => {
                const { width: w } = container.getBoundingClientRect();
                setWidth(w);
            };
            const ro = new ResizeObserver(cb);
            ro.observe(container);
            return () => {
                ro.disconnect();
            };
        }
    }, []);

    const handleForceLayout = useCallback(() => {
        graph.refresh();
    }, [graph]);

    return (
        <Container>
            <div ref={containerRef} />
            <div className="tools">
                <DefaultButton
                    style={{
                        marginBottom: '1em',
                        padding: '0.4em 0',
                        height: 'unset',
                    }}
                    onClick={handleForceLayout}
                    iconProps={{ iconName: 'Play' }}
                >
                    {getI18n('chart.re_layout')}
                </DefaultButton>
            </div>
        </Container>
    );
};

export default observer(FDGraph);
