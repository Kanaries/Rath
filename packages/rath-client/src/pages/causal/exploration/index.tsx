import intl from 'react-intl-universal';
import { observer } from 'mobx-react-lite';
import { forwardRef, useCallback, useEffect, useImperativeHandle, useMemo, useRef, useState } from 'react';
import { GraphicWalker } from '../../../components/graphic-walker';
import type { IPattern } from '@kanaries/loa';
import styled from 'styled-components';
import type { Specification } from 'visual-insights';
import { Badge } from '../../../components/ui/badge';
import { Button } from '../../../components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '../../../components/ui/tabs';
import { RathIcon } from '../../../components/icons';
import type { IFieldMeta } from '../../../interfaces';
import { useGlobalStore } from '../../../store';
import SemiEmbed from '../../semiAutomation/semiEmbed';
import { PAG_NODE } from '../config';
import { ExplorationKey, ExplorationKeys, useCausalViewContext } from '../../../store/causalStore/viewStore';
import CrossFilter from './crossFilter';
import PredictPanel from './predictPanel';
import RExplainer from './explainer/RExplainer';
import AutoVis from './autoVis';
import { useAppearance } from '../../../appearance';
// import CausalBlame from './causalBlame';

const Container = styled.div`
    flex-grow: 1;
    flex-shrink: 1;
    overflow: hidden;
    display: flex;
    flex-direction: column;
    padding: 0 1em;
    & .body {
        flex-grow: 1;
        flex-shrink: 1;
        overflow: auto;
        margin-top: 0.5em;
        display: flex;
        flex-direction: column;
    }
`;

export interface Subtree {
    node: IFieldMeta;
    neighbors: {
        field: IFieldMeta;
        rootType: PAG_NODE;
        neighborType: PAG_NODE;
    }[];
}

/** exploration modes that consume the node selection made on the causal graph */
const SELECTION_DRIVEN = [ExplorationKey.AUTO_VIS, ExplorationKey.CROSS_FILTER, ExplorationKey.CAUSAL_INSIGHT];

const EmptyGuide = () => (
    <div className="mx-1 my-4 flex flex-col items-center rounded-lg border-2 border-dashed px-6 py-9 text-center">
        <RathIcon name="Relationship" size={26} className="mb-2.5 text-muted-foreground/60" />
        <p className="text-sm font-medium">{intl.get('causal.exploration.empty_title')}</p>
        <span className="mt-1 text-xs text-muted-foreground">{intl.get('causal.exploration.empty_desc')}</span>
    </div>
);

const Exploration = forwardRef<
    {
        onSubtreeSelected?: (subtree: Subtree | null) => void;
    },
    {}
>(function ManualAnalyzer(_, ref) {
    const { resolvedAppearance } = useAppearance();
    const { dataSourceStore, langStore, causalStore } = useGlobalStore();
    const { fieldMetas } = dataSourceStore;
    const [showSemiClue, setShowSemiClue] = useState(false);
    const [clueView, setClueView] = useState<IPattern | null>(null);
    const { fields, visSample, filters } = causalStore.dataset;

    const viewContext = useCausalViewContext();
    const { selectedFieldGroup = [] } = viewContext ?? {};

    useEffect(() => {
        if (selectedFieldGroup.length > 0) {
            setClueView({
                fields: selectedFieldGroup.slice(0),
                filters: filters.slice(0),
                imp: 0,
            });
        } else {
            setClueView(null);
        }
    }, [selectedFieldGroup, filters]);

    const initialSpec = useMemo<Specification>(() => {
        const [discreteChannel, concreteChannel] = selectedFieldGroup.reduce<[IFieldMeta[], IFieldMeta[]]>(
            ([discrete, concrete], f, i) => {
                if (i === 0 || f.semanticType === 'quantitative' || f.semanticType === 'temporal') {
                    concrete.push(f);
                } else {
                    discrete.push(f);
                }
                return [discrete, concrete];
            },
            [[], []]
        );
        return selectedFieldGroup.length
            ? {
                  position: concreteChannel.map((f) => f.fid),
                  color: discreteChannel[0] ? [discreteChannel[0].fid] : [],
                  size: discreteChannel[1] ? [discreteChannel[1].fid] : [],
                  opacity: discreteChannel[2] ? [discreteChannel[2].fid] : [],
              }
            : {};
        // 散点图（分布矩阵）
        // TODO: [feat] Graphic Walker 支持受控状态
        // by kyusho, 2 weeks ago
        // 多变量直方图现在存在支持问题：
        // 1. GraphicWalker 解析 Specification 的规则导致不能叠加在 Column 上。
        // 2. 不应该默认聚合。
        // ----
        // 多变量直方图
        // TODO: [feat] GraphicWalker 支持 Vega bin
        // kyusho, 2 weeks ago
        // 多变量直方图现在存在支持问题：
        // 1. GraphicWalker 不支持 vega bin，Specification 也传不了 bin。
        // 2. GraphicWalker 解析 Specification 的规则导致不能叠加在 Column 上。
        // return {
        //     geomType: fieldGroup.map(f => f.semanticType === 'temporal' ? 'area' : 'interval'),
        //     position: ['gw_count_fid'],
        //     facets: fieldGroup.map(f => f.fid),
        // };
    }, [selectedFieldGroup]);

    const predictPanelRef = useRef<{ updateInput?: (input: { features: Readonly<IFieldMeta>[]; targets: Readonly<IFieldMeta>[] }) => void }>({});

    useImperativeHandle(ref, () => ({
        onSubtreeSelected: (subtree) => {
            if (viewContext?.explorationKey === 'predict' && subtree && subtree.neighbors.length > 0) {
                const features = subtree.neighbors
                    .filter((neighbor) => {
                        return !([PAG_NODE.BLANK, PAG_NODE.CIRCLE].includes(neighbor.rootType) && neighbor.neighborType === PAG_NODE.ARROW);
                    })
                    .map((cause) => cause.field);
                predictPanelRef.current.updateInput?.({
                    features,
                    targets: [subtree.node],
                });
            }
        },
    }));

    const clearFieldGroup = useCallback(() => {
        viewContext?.clearSelected();
    }, [viewContext]);

    const removeSelectedField = useCallback(
        (fid: string) => {
            viewContext?.toggleNodeSelected(fid);
        },
        [viewContext]
    );

    const ExplorationOptions = useMemo(() => {
        return ExplorationKeys.map((key) => ({
            key,
            text: intl.get(`causal.exploration.${key}`),
        }));
    }, []);

    if (!viewContext) {
        return null;
    }

    const selectionAware = SELECTION_DRIVEN.includes(viewContext.explorationKey);

    return (
        <Container>
            <Tabs
                value={viewContext.explorationKey}
                onValueChange={(value) => viewContext.setExplorationKey(value as ExplorationKey)}
                className="flex-none"
            >
                <TabsList className="h-auto w-full justify-start gap-0.5 rounded-none border-b bg-transparent p-0">
                    {ExplorationOptions.map((mode) => (
                        <TabsTrigger
                            key={mode.key}
                            value={mode.key}
                            className="-mb-px rounded-none border-b-2 border-transparent bg-transparent px-2.5 py-1.5 data-[state=active]:border-foreground data-[state=active]:bg-transparent data-[state=active]:shadow-none"
                        >
                            {mode.text}
                        </TabsTrigger>
                    ))}
                </TabsList>
            </Tabs>
            <div className="mt-2 flex flex-none flex-wrap items-center gap-1.5">
                <span className="mr-0.5 text-[11px] font-medium uppercase tracking-wider text-muted-foreground/70">
                    {intl.get('causal.analyze.selection')}
                </span>
                {selectedFieldGroup.map((f) => (
                    <Badge key={f.fid} variant="secondary" className="gap-1 pr-1 font-normal">
                        {f.name || f.fid}
                        <button
                            type="button"
                            aria-label={`${intl.get('causal.actions.clear')} ${f.name || f.fid}`}
                            className="rounded-full p-0.5 opacity-60 hover:bg-foreground/10 hover:opacity-100"
                            onClick={() => removeSelectedField(f.fid)}
                        >
                            <RathIcon name="ChromeClose" size={9} />
                        </button>
                    </Badge>
                ))}
                {selectedFieldGroup.length > 0 ? (
                    <Button variant="ghost" size="sm" className="h-6 px-2 text-xs text-muted-foreground" onClick={clearFieldGroup}>
                        {intl.get('causal.actions.clear')}
                    </Button>
                ) : (
                    <span className="text-xs text-muted-foreground/70">{intl.get('causal.exploration.empty_title')}</span>
                )}
                {[ExplorationKey.CROSS_FILTER, ExplorationKey.GRAPHIC_WALKER].includes(viewContext.explorationKey) && (
                    <SemiEmbed
                        view={clueView}
                        show={showSemiClue}
                        toggleShow={() => {
                            setShowSemiClue((v) => !v);
                        }}
                        neighborKeys={clueView ? clueView.fields.slice(0, 1).map((f) => f.fid) : []}
                    />
                )}
            </div>
            <div className="body">
                {selectionAware && selectedFieldGroup.length === 0 ? (
                    <EmptyGuide />
                ) : (
                    {
                        // [ExplorationKey.CAUSAL_BLAME]: (
                        //     <CausalBlame />
                        // ),
                        [ExplorationKey.AUTO_VIS]: <AutoVis />,
                        [ExplorationKey.CROSS_FILTER]: visSample.length > 0 && selectedFieldGroup.length > 0 && (
                            <CrossFilter
                                fields={selectedFieldGroup}
                                dataSource={visSample}
                                onVizClue={(fid) => {
                                    const field = fields.find((f) => f.fid === fid);
                                    if (field) {
                                        setClueView({
                                            fields: [field],
                                            filters: [...filters],
                                            imp: 0,
                                        });
                                        setShowSemiClue(true);
                                    }
                                }}
                                onVizDelete={removeSelectedField}
                            />
                        ),
                        [ExplorationKey.CAUSAL_INSIGHT]: visSample.length > 0 && <RExplainer />,
                        [ExplorationKey.GRAPHIC_WALKER]: (
                            /* 小心这里的内存占用 */
                            <GraphicWalker
                                dataSource={visSample.slice(0)}
                                rawFields={fieldMetas}
                                spec={initialSpec}
                                i18nLang={langStore.lang}
                                keepAlive={false}
                                dark={resolvedAppearance}
                                fieldKeyGuard={false}
                            />
                        ),
                        [ExplorationKey.PREDICT]: <PredictPanel ref={predictPanelRef} />,
                    }[viewContext.explorationKey]
                )}
            </div>
        </Container>
    );
});

export default observer(Exploration);
