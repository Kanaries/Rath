import intl from 'react-intl-universal';
import { observer } from 'mobx-react-lite';
import { FC, useEffect, useState, type JSX } from 'react';
import styled from 'styled-components';
import { Spinner } from '../../components/ui/spinner';
import { Tabs, TabsList, TabsTrigger } from '../../components/ui/tabs';
import { RathIcon } from '../../components/icons';
import { RathSelect } from '../../components/rath-ui/rath-select';
import type { IFieldMeta } from '../../interfaces';
import { useGlobalStore } from '../../store';
import DirectionMatrix from './matrixPanel/directionMatrix';
import RelationMatrixHeatMap from './matrixPanel/relationMatrixHeatMap';

export enum CANVAS_VIEW {
    graph = 'graph',
    matrix = 'matrix',
}

export enum MATRIX_TYPE {
    mutualInfo = 'mutual_info',
    conditionalMutualInfo = 'conditional_mutual_info',
    causal = 'causal_discover',
}

const Container = styled.div`
    flex-grow: 1;
    flex-shrink: 1;
    min-height: 0;
    display: flex;
    flex-direction: column;
    overflow: hidden;
`;

const Stage = styled.div`
    flex-grow: 1;
    flex-shrink: 1;
    min-height: 0;
    position: relative;
    border: 1px solid var(--border);
    border-radius: 10px;
    overflow: hidden;
    background-image: radial-gradient(color-mix(in srgb, var(--foreground) 7%, transparent) 1px, transparent 1px);
    background-size: 22px 22px;
    background-color: color-mix(in srgb, var(--muted) 30%, transparent);
`;

const MatrixScroll = styled.div`
    position: absolute;
    inset: 0;
    overflow: auto;
    padding: 1.5em;
    display: flex;
    align-items: flex-start;
    justify-content: center;
`;

function showMatrix(causalFields: readonly IFieldMeta[], mat: readonly (readonly number[])[], computing: boolean): boolean {
    return causalFields.length > 0 && mat.length > 0 && causalFields.length === mat.length && !computing;
}

interface CausalCanvasProps {
    onMatrixPointClick?: (xFid: string, yFid: string) => void;
    /** requests computation of a matrix source that has no cached result yet */
    onCompute: (type: MATRIX_TYPE) => void;
    diagram?: JSX.Element;
}

const CausalCanvas: FC<CausalCanvasProps> = ({ onMatrixPointClick, onCompute, diagram }) => {
    const [view, setView] = useState<CANVAS_VIEW>(CANVAS_VIEW.graph);
    const [source, setSource] = useState<MATRIX_TYPE>(MATRIX_TYPE.causal);
    const [markType, setMarkType] = useState<'circle' | 'square'>('circle');
    const { causalStore } = useGlobalStore();
    const { fields } = causalStore;
    const { mutualMatrix, condMutualMatrix, causalityRaw } = causalStore.model;
    const { busy } = causalStore.operator;

    const sourceOptions = [
        { key: MATRIX_TYPE.causal, text: intl.get('causal.analyze.causal_discover') },
        { key: MATRIX_TYPE.mutualInfo, text: intl.get('causal.analyze.mutual_info') },
        { key: MATRIX_TYPE.conditionalMutualInfo, text: intl.get('causal.analyze.conditional_mutual_info') },
    ];

    const markOptions = [
        { key: 'circle', text: intl.get('causal.analyze.circle') },
        { key: 'square', text: intl.get('causal.analyze.square') },
    ];

    const activeMatrix = {
        [MATRIX_TYPE.mutualInfo]: mutualMatrix,
        [MATRIX_TYPE.conditionalMutualInfo]: condMutualMatrix,
        [MATRIX_TYPE.causal]: causalityRaw,
    }[source];

    // switching to a matrix source without a cached result kicks off its computation
    useEffect(() => {
        if (view !== CANVAS_VIEW.matrix || busy || source === MATRIX_TYPE.causal) {
            return;
        }
        const cached = source === MATRIX_TYPE.mutualInfo ? mutualMatrix : condMutualMatrix;
        if (!cached || cached.length === 0) {
            onCompute(source);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [view, source]);

    return (
        <Container>
            <div className="flex flex-none flex-wrap items-center gap-2 py-2">
                <Tabs value={view} onValueChange={(value) => setView(value as CANVAS_VIEW)}>
                    <TabsList>
                        <TabsTrigger value={CANVAS_VIEW.graph} className="gap-1.5">
                            <RathIcon name="Relationship" size={13} />
                            {intl.get('causal.analyze.graph')}
                        </TabsTrigger>
                        <TabsTrigger value={CANVAS_VIEW.matrix} className="gap-1.5">
                            <RathIcon name="Table" size={13} />
                            {intl.get('causal.analyze.matrix')}
                        </TabsTrigger>
                    </TabsList>
                </Tabs>
                {view === CANVAS_VIEW.matrix && (
                    <>
                        <RathSelect
                            options={sourceOptions}
                            selectedKey={source}
                            onChange={(key) => setSource(key as MATRIX_TYPE)}
                            ariaLabel={intl.get('causal.analyze.source')}
                            triggerClassName="h-7 text-xs"
                            renderValue={(option) => (
                                <>
                                    <span className="mr-1.5 text-muted-foreground">{intl.get('causal.analyze.source')}</span>
                                    {option?.text}
                                </>
                            )}
                        />
                        <RathSelect
                            options={markOptions}
                            selectedKey={markType}
                            onChange={(key) => setMarkType(key as 'circle' | 'square')}
                            ariaLabel={intl.get('causal.analyze.mark')}
                            triggerClassName="h-7 text-xs"
                            renderValue={(option) => (
                                <>
                                    <span className="mr-1.5 text-muted-foreground">{intl.get('causal.analyze.mark')}</span>
                                    {option?.text}
                                </>
                            )}
                        />
                    </>
                )}
            </div>
            <Stage>
                {view === CANVAS_VIEW.graph && diagram}
                {view === CANVAS_VIEW.matrix && (
                    <MatrixScroll>
                        {source === MATRIX_TYPE.causal
                            ? causalityRaw &&
                              showMatrix(fields, causalityRaw, busy) && (
                                  <DirectionMatrix mark={markType} fields={fields} data={causalityRaw} onSelect={onMatrixPointClick} />
                              )
                            : activeMatrix &&
                              showMatrix(fields, activeMatrix, busy) && (
                                  <RelationMatrixHeatMap
                                      mark={markType}
                                      absolute
                                      fields={fields}
                                      data={activeMatrix}
                                      onSelect={onMatrixPointClick}
                                  />
                              )}
                    </MatrixScroll>
                )}
                {busy && (
                    <div className="absolute inset-0 z-10 flex items-center justify-center gap-2 bg-background/60 text-sm text-muted-foreground backdrop-blur-[2px]">
                        <Spinner aria-hidden="true" />
                        <span>{intl.get('causal.status.computing')}</span>
                    </div>
                )}
            </Stage>
        </Container>
    );
};

export default observer(CausalCanvas);
