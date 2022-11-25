import { ActionButton, Pivot, PivotItem, Stack } from '@fluentui/react';
import { observer } from 'mobx-react-lite';
import React, { useEffect, useMemo, useState } from 'react';
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
import type { PagLink } from './config';


const Container = styled.div`
    overflow: hidden;
    display: flex;
    flex-direction: column;
    & .body {
        flex-grow: 1;
        flex-shrink: 1;
        overflow: auto;
        margin-top: 1em;
    }
`;

export interface ManualAnalyzerProps {
    context: ReturnType<typeof useDataViews>;
    interactFieldGroups: ReturnType<typeof useInteractFieldGroups>;
    edges: PagLink[];
}

const ManualAnalyzer: React.FC<ManualAnalyzerProps> = ({ context, interactFieldGroups, edges }) => {
    const { dataSourceStore, causalStore, langStore } = useGlobalStore();
    const { fieldMetas } = dataSourceStore;
    const { fieldGroup, setFieldGroup, clearFieldGroup } = interactFieldGroups;
    const [showSemiClue, setShowSemiClue] = useState(false);
    const [clueView, setClueView] = useState<IPattern | null>(null);
    const [customAnalysisMode, setCustomAnalysisMode] = useState<'explainer' | 'crossFilter' | 'graphicWalker'>('explainer');
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
        // TODO: Graphic Walker 支持受控状态
        // 多变量直方图现在存在支持问题：
        // 1. GraphicWalker 解析 Specification 的规则导致不能叠加在 Column 上。
        // 2. 不应该默认聚合。
        // ----
        // 多变量直方图
        // TODO: GraphicWalker 支持 Vega bin
        // 多变量直方图现在存在支持问题：
        // 1. GraphicWalker 不支持 vega bin，Specification 也传不了 bin。
        // 2. GraphicWalker 解析 Specification 的规则导致不能叠加在 Column 上。
        // return {
        //     geomType: fieldGroup.map(f => f.semanticType === 'temporal' ? 'area' : 'interval'),
        //     position: ['gw_count_fid'],
        //     facets: fieldGroup.map(f => f.fid),
        // };
    }, [fieldGroup]);

    return (
        <Container>
            <Pivot
                style={{ marginBottom: '0.4em' }}
                selectedKey={customAnalysisMode}
                onLinkClick={(item) => {
                    item && setCustomAnalysisMode(item.props.itemKey as 'crossFilter' | 'graphicWalker');
                }}
            >
                <PivotItem itemKey="explainer" headerText="可解释探索" />
                <PivotItem itemKey="crossFilter" headerText="因果验证" />
                <PivotItem itemKey="graphicWalker" headerText="可视化自助分析" />
            </Pivot>
            <Stack horizontal>
                {customAnalysisMode !== 'explainer' && (
                    <SemiEmbed
                        view={clueView}
                        show={showSemiClue}
                        toggleShow={() => {
                            setShowSemiClue((v) => !v);
                        }}
                        neighborKeys={clueView ? clueView.fields.slice(0, 1).map(f => f.fid) : []}
                    />
                )}
                {customAnalysisMode !== 'graphicWalker' && (
                    <ActionButton
                        iconProps={{ iconName: 'Delete' }}
                        text="清除全部选择字段"
                        disabled={fieldGroup.length === 0}
                        onClick={clearFieldGroup}
                    />
                )}
            </Stack>
            <div className="body">
                {customAnalysisMode === 'explainer' && vizSampleData.length > 0 && fieldGroup.length > 0 && (
                    <RExplainer
                        context={context}
                        interactFieldGroups={interactFieldGroups}
                        edges={edges}
                    />
                )}
                {customAnalysisMode === 'crossFilter' && vizSampleData.length > 0 && fieldGroup.length > 0 && (
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
                )}
                {/* 小心这里的内存占用 */}
                {customAnalysisMode === 'graphicWalker' && (
                    <GraphicWalker
                        dataSource={vizSampleData}
                        rawFields={fieldMetas}
                        hideDataSourceConfig
                        spec={initialSpec}
                        i18nLang={langStore.lang}
                        keepAlive={false}
                    />
                )}
            </div>
        </Container>
    );
};

export default observer(ManualAnalyzer);
