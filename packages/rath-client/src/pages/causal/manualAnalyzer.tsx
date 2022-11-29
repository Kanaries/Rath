import { ActionButton, Pivot, PivotItem, Stack } from '@fluentui/react';
import { observer } from 'mobx-react-lite';
import { forwardRef, useEffect, useImperativeHandle, useMemo, useRef, useState } from 'react';
import { GraphicWalker } from '@kanaries/graphic-walker';
import type { IPattern } from '@kanaries/loa';
import styled from 'styled-components';
import type { Specification } from 'visual-insights';
import type { IFieldMeta } from '../../interfaces';
import { useGlobalStore } from '../../store';
import SemiEmbed from '../semiAutomation/semiEmbed';
import CrossFilter from './crossFilter';
import type { useInteractFieldGroups } from './hooks/interactFieldGroup';
import type { useDataViews } from './hooks/dataViews';
import RExplainer from './explainer/RExplainer';
import type { IFunctionalDep, PagLink } from './config';
import PredictPanel from './predictPanel';
import type { ExplorerProps } from './explorer';


const Container = styled.div`
    flex-grow: 1;
    flex-shrink: 1;
    overflow: hidden;
    display: flex;
    flex-direction: column;
    & .body {
        flex-grow: 1;
        flex-shrink: 1;
        overflow: auto;
        margin-top: 1em;
        display: flex;
        flex-direction: column;
    }
`;

export interface ManualAnalyzerProps {
    context: ReturnType<typeof useDataViews>;
    interactFieldGroups: ReturnType<typeof useInteractFieldGroups>;
    functionalDependencies: IFunctionalDep[];
    edges: PagLink[];

}

const CustomAnalysisModes = [
    { key: 'crossFilter', text: '因果验证' },
    { key: 'explainer', text: '可解释探索' },
    { key: 'graphicWalker', text: '可视化自助分析' },
    { key: 'predict', text: '模型预测' },
] as const;

type CustomAnalysisMode = typeof CustomAnalysisModes[number]['key'];

const ManualAnalyzer = forwardRef<{ onSubtreeSelected?: ExplorerProps['onNodeSelected'] }, ManualAnalyzerProps>(function ManualAnalyzer (
    { context, interactFieldGroups, functionalDependencies, edges }, ref
) {
    const { dataSourceStore, causalStore, langStore } = useGlobalStore();
    const { fieldMetas } = dataSourceStore;
    const { fieldGroup, setFieldGroup, clearFieldGroup } = interactFieldGroups;
    const [showSemiClue, setShowSemiClue] = useState(false);
    const [clueView, setClueView] = useState<IPattern | null>(null);
    const [customAnalysisMode, setCustomAnalysisMode] = useState<CustomAnalysisMode>('crossFilter');
    const { selectedFields } = causalStore;

    const { vizSampleData, filters } = context;

    useEffect(() => {
        if (fieldGroup.length > 0) {
            setClueView({
                fields: [...fieldGroup],
                filters: [...filters],
                imp: 0,
            });
        } else {
            setClueView(null);
        }
    }, [fieldGroup, filters]);

    const initialSpec = useMemo<Specification>(() => {
        const [discreteChannel, concreteChannel] = fieldGroup.reduce<[IFieldMeta[], IFieldMeta[]]>(
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
        return fieldGroup.length
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
    }, [fieldGroup]);

    const predictPanelRef = useRef<{ updateInput?: (input: {
        features: Readonly<IFieldMeta>[]; targets: Readonly<IFieldMeta>[]
    }) => void }>({});

    useImperativeHandle(ref, () => ({
        onSubtreeSelected: (node, simpleCause) => {
            if (customAnalysisMode === 'predict' && node && simpleCause.length > 0) {
                const features = simpleCause.map(cause => cause.field);
                predictPanelRef.current.updateInput?.({
                    features,
                    targets: [node],
                });
            }
        },
    }));

    return (
        <Container>
            <Pivot
                style={{ marginBottom: '0.4em' }}
                selectedKey={customAnalysisMode}
                onLinkClick={(item) => {
                    item && setCustomAnalysisMode(item.props.itemKey as CustomAnalysisMode);
                }}
            >
                {CustomAnalysisModes.map(mode => (
                    <PivotItem key={mode.key} itemKey={mode.key} headerText={mode.text} />
                ))}
            </Pivot>
            <Stack horizontal>
                {new Array<CustomAnalysisMode>('crossFilter', 'graphicWalker').includes(customAnalysisMode) && (
                    <SemiEmbed
                        view={clueView}
                        show={showSemiClue}
                        toggleShow={() => {
                            setShowSemiClue((v) => !v);
                        }}
                        neighborKeys={clueView ? clueView.fields.slice(0, 1).map(f => f.fid) : []}
                    />
                )}
                {new Array<CustomAnalysisMode>('crossFilter', 'explainer').includes(customAnalysisMode) && (
                    <ActionButton
                        iconProps={{ iconName: 'Delete' }}
                        text="清除全部选择字段"
                        disabled={fieldGroup.length === 0}
                        onClick={clearFieldGroup}
                    />
                )}
            </Stack>
            <div className="body">
                {{
                    predict: (
                        <PredictPanel ref={predictPanelRef} />
                    ),
                    explainer: vizSampleData.length > 0 && fieldGroup.length > 0 && (
                        <RExplainer
                            context={context}
                            interactFieldGroups={interactFieldGroups}
                            functionalDependencies={functionalDependencies}
                            edges={edges}
                        />
                    ),
                    crossFilter: vizSampleData.length > 0 && fieldGroup.length > 0 && (
                        <CrossFilter
                            fields={fieldGroup}
                            dataSource={vizSampleData}
                            onVizClue={(fid) => {
                                const field = selectedFields.find((f) => f.fid === fid);
                                if (field) {
                                    setClueView({
                                        fields: [field],
                                        filters: [...filters],
                                        imp: 0,
                                    });
                                    setShowSemiClue(true);
                                }
                            }}
                            onVizDelete={(fid) => {
                                setFieldGroup((list) => list.filter((f) => f.fid !== fid));
                            }}
                        />
                    ),
                    graphicWalker: (
                        /* 小心这里的内存占用 */
                        <GraphicWalker
                            dataSource={vizSampleData}
                            rawFields={fieldMetas}
                            hideDataSourceConfig
                            spec={initialSpec}
                            i18nLang={langStore.lang}
                            keepAlive={false}
                        />
                    ),
                }[customAnalysisMode]}
            </div>
        </Container>
    );
});

export default observer(ManualAnalyzer);
