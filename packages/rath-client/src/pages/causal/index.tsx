import {
    ActionButton,
    ComboBox,
    DefaultButton,
    Dropdown,
    Label,
    Pivot,
    PivotItem,
    PrimaryButton,
    Slider,
    Spinner,
    Stack,
    IColumn,
    DetailsList,
    SelectionMode,
} from '@fluentui/react';
import { observer } from 'mobx-react-lite';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { GraphicWalker } from '@kanaries/graphic-walker';
import produce from 'immer';
import type { Specification } from 'visual-insights';
import { IFieldMeta } from '../../interfaces';
import { useGlobalStore } from '../../store';
import FilterCreationPill from '../../components/filterCreationPill';
import LaTiaoConsole from '../dataSource/LaTiaoConsole';
import SemiEmbed from '../semiAutomation/semiEmbed';
import Explorer from './explorer';
import CrossFilter from './crossFilter';
import Params from './params';
import { NodeWithScore } from './explorer/flowAnalyzer';
import type { BgKnowledge, ModifiableBgKnowledge } from './config';
import { FilterCell } from './filters';
import ModelStorage from './modelStorage';
import MatrixPanel, { MATRIX_TYPE } from './matrixPanel';
import { useInteractFieldGroups } from './hooks/interactFieldGroup';
import { useDataViews } from './hooks/dataViews';
import { InnerCard } from './components';

const CausalPage: React.FC = () => {
    const { dataSourceStore, causalStore, langStore } = useGlobalStore();
    const { fieldMetas, cleanedData } = dataSourceStore;
    const { fieldGroup, setFieldGroup, appendFields2Group, clearFieldGroup } = useInteractFieldGroups(fieldMetas);
    const [showSemiClue, setShowSemiClue] = useState(false);
    const [customAnalysisMode, setCustomAnalysisMode] = useState<'crossFilter' | 'graphicWalker'>('crossFilter');
    const { igMatrix, causalFields, causalStrength, computing, selectedFields, focusFieldIds } = causalStore;

    const [editingPrecondition, setEditingPrecondition] = useState<Partial<ModifiableBgKnowledge>>({
        type: 'must-link',
    });
    const [modifiablePrecondition, setModifiablePrecondition] = useState<ModifiableBgKnowledge[]>([]);

    const precondition = useMemo<BgKnowledge[]>(() => {
        if (computing || igMatrix.length !== selectedFields.length) {
            return [];
        }
        return modifiablePrecondition.reduce<BgKnowledge[]>((list, decl) => {
            const srcIdx = selectedFields.findIndex((f) => f.fid === decl.src);
            const tarIdx = selectedFields.findIndex((f) => f.fid === decl.tar);

            if (srcIdx !== -1 && tarIdx !== -1) {
                list.push({
                    src: decl.src,
                    tar: decl.tar,
                    type:
                        decl.type === 'must-link'
                            ? 1
                            : decl.type === 'must-not-link'
                            ? -1
                            : (igMatrix[srcIdx][tarIdx] + 1) / 2, // TODO: 暂时定为一半
                });
            }

            return list;
        }, []);
    }, [igMatrix, modifiablePrecondition, selectedFields, computing]);
    const {
        vizSampleData,
        dataSubset,
        sampleRate,
        setSampleRate,
        appliedSampleRate,
        filters,
        setFilters,
        sampleSize
    } = useDataViews(cleanedData)

    useEffect(() => {
        causalStore.setFocusFieldIds(
            fieldMetas
                .filter((f) => f.disable !== true)
                .slice(0, 10)
                .map((f) => f.fid)
        ); // 默认只使用前 10 个)
        setEditingPrecondition({ type: 'must-link' });
    }, [fieldMetas, causalStore]);

    const getGeneratedPreconditionsFromIGMat = useCallback(() => {
        const initLinks: ModifiableBgKnowledge[] = [];
        const mat = igMatrix;
        // TODO: 临时定的阈值
        const thresholdFalse = 0.01;
        const thresholdPrefer = 0.1;
        const thresholdMayContainLinearlyIndependency = 0.8;    // 线性相关不能反映成因果
        if (mat.length === selectedFields.length) {
            for (let i = 0; i < mat.length - 1; i += 1) {
                for (let j = i + 1; j < mat.length; j += 1) {
                    const wf = mat[i][j];
                    const wb = mat[j][i];
                    if (Math.max(wf, wb) >= thresholdMayContainLinearlyIndependency) {
                        initLinks.push({
                            src: selectedFields[i].fid,
                            tar: selectedFields[j].fid,
                            type: 'must-not-link',
                        });
                    } else if (wf + wb < thresholdFalse) {
                        initLinks.push({
                            src: selectedFields[i].fid,
                            tar: selectedFields[j].fid,
                            type: 'must-not-link',
                        });
                    } else if (Math.max(wf, wb) >= thresholdPrefer) {
                        initLinks.push({
                            src: selectedFields[i].fid,
                            tar: selectedFields[j].fid,
                            type: 'prefer-link',
                        });
                    }
                }
            }
        }
        return [
            ...selectedFields.reduce<ModifiableBgKnowledge[]>((list, f) => {
                if (f.extInfo) {
                    for (const from of f.extInfo.extFrom) {
                        list.push({
                            src: from,
                            tar: f.fid,
                            type: 'must-link',
                        });
                    }
                }
                return list;
            }, []),
            ...initLinks,
        ];
    }, [selectedFields, igMatrix]);

    useEffect(() => {
        setModifiablePrecondition(getGeneratedPreconditionsFromIGMat());
    }, [getGeneratedPreconditionsFromIGMat]);

    useEffect(() => {
        causalStore.updateCausalAlgorithmList(fieldMetas);
    }, [causalStore, fieldMetas]);

    const onFieldGroupSelect = useCallback(
        (xFid: string, yFid: string) => {
            causalStore.setFocusNodeIndex(fieldMetas.findIndex((f) => f.fid === xFid));
            appendFields2Group([xFid, yFid]);
        },
        [appendFields2Group, causalStore, fieldMetas]
    );

    const handleSubTreeSelected = useCallback(
        (
            node: Readonly<IFieldMeta> | null,
            simpleCause: readonly Readonly<NodeWithScore>[],
            simpleEffect: readonly Readonly<NodeWithScore>[],
            composedCause: readonly Readonly<NodeWithScore>[],
            composedEffect: readonly Readonly<NodeWithScore>[]
        ) => {
            if (node) {
                const allEffect = composedEffect
                    .reduce<Readonly<NodeWithScore>[]>(
                        (list, f) => {
                            if (!list.some((which) => which.field.fid === f.field.fid)) {
                                list.push(f);
                            }
                            return list;
                        },
                        [...simpleEffect]
                    )
                    .sort((a, b) => b.score - a.score);
                // console.log(allEffect)
                setFieldGroup([node, ...allEffect.map((f) => f.field)]);
            }
        },
        [setFieldGroup]
    );

    const focusFieldsOption = useMemo(
        () =>
            fieldMetas.map((f) => ({
                key: f.fid,
                text: f.name ?? f.fid,
            })),
        [fieldMetas]
    );

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

    const exploringFields = igMatrix.length === causalStrength.length ? causalFields : selectedFields;

    const preconditionTableCols = useMemo<IColumn[]>(() => {
        return [
            {
                key: 'delete-btn',
                name: '',
                onRender: (item, index) => typeof index === 'number' ? (
                    <ActionButton
                        styles={{
                            root: {
                                height: 'unset',
                                transform: 'scale(0.8)',
                            }
                        }}
                        iconProps={{
                            iconName: 'Clear',
                        }}
                        onClick={() => {
                            setModifiablePrecondition(list => {
                                const next = [...list];
                                next.splice(index, 1);
                                return next;
                            });
                        }}
                    />
                ) : null,
                minWidth: 30,
                maxWidth: 30,
                onRenderHeader: () => (
                    <ActionButton
                        styles={{
                            root: {
                                height: 'unset',
                                transform: 'scale(0.8)',
                            }
                        }}
                        iconProps={{
                            iconName: 'Delete',
                        }}
                        onClick={() => {
                            setModifiablePrecondition([]);
                        }}
                    />
                ),
            },
            {
                key: 'src',
                name: 'Source',
                onRender: item => (
                    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {fieldMetas.find(f => f.fid === item.src)?.name ?? item.src}
                    </span>
                ),
                minWidth: 160,
                maxWidth: 160,
            },
            {
                key: 'type',
                name: 'Constraint',
                onRender: (item: ModifiableBgKnowledge, index) => typeof index === 'number' ? (
                    <Dropdown
                        selectedKey={item.type}
                        options={[
                            { key: 'must-link', text: 'must link' },
                            { key: 'must-not-link', text: 'must not link' },
                            { key: 'prefer-link', text: 'prefer to link' },
                        ]}
                        onChange={(e, option) => {
                            if (!option) {
                                return;
                            }
                            const linkType = option.key as typeof item.type;
                            setModifiablePrecondition(p => produce(p, draft => {
                                draft[index].type = linkType;
                            }));
                        }}
                        styles={{
                            title: {
                                fontSize: '0.8rem',
                                lineHeight: '1.8em',
                                height: '1.8em',
                                padding: '0 2.8em 0 0.8em',
                                border: 'none',
                                borderBottom: '1px solid #8888'
                            },
                            caretDownWrapper: {
                                fontSize: '0.8rem',
                                lineHeight: '1.8em',
                                height: '1.8em',
                            },
                            caretDown: {
                                fontSize: '0.8rem',
                                lineHeight: '1.8em',
                                height: '1.8em',
                            },
                        }}
                    />
                ) : null,
                minWidth: 140,
                maxWidth: 140,
            },
            {
                key: 'tar',
                name: 'Target',
                onRender: item => (
                    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {fieldMetas.find(f => f.fid === item.src)?.name ?? item.src}
                    </span>
                ),
                minWidth: 160,
                maxWidth: 160,
            },
            {
                key: 'empty',
                name: '',
                onRender: () => <div />,
                minWidth: 0,
            }
        ];
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return (
        <div className="content-container">
            <div className="card">
                <h1 style={{ fontSize: '1.6em', fontWeight: 500 }}>因果分析</h1>
                <InnerCard>
                    <h1 className="card-header">数据集配置</h1>
                    <hr className="card-line" />
                    <Stack style={{ marginBlock: '0.6em -0.6em' }}>
                        <LaTiaoConsole />
                    </Stack>
                    <Stack style={{ marginBlock: '0.8em' }}>
                        <Slider
                            label="采样率"
                            min={0.01}
                            max={1}
                            step={0.01}
                            value={sampleRate}
                            showValue
                            onChange={val => setSampleRate(val)}
                            valueFormat={val => `${(val * 100).toFixed(0)}%`}
                            styles={{
                                root: {
                                    flexGrow: 0,
                                    flexShrink: 0,
                                    display: 'flex',
                                    flexDirection: 'row',
                                    flexWrap: 'wrap',
                                    alignItems: 'center',
                                },
                                container: {
                                    minWidth: '160px',
                                    maxWidth: '300px',
                                    flexGrow: 1,
                                    flexShrink: 0,
                                    marginInline: '1vmax',
                                },
                            }}
                        />
                        <small style={{ padding: '0.2em 0', color: '#666', display: 'flex', alignItems: 'center' }}>
                            {`原始大小: ${cleanedData.length} 行，样本量: `}
                            {sampleRate !== appliedSampleRate ? <Spinner style={{ display: 'inline-block', transform: 'scale(0.9)', margin: '-50% 0.6em' }} /> : `${sampleSize} 行`}
                        </small>
                    </Stack>
                    <Stack style={{ marginTop: '0.3em' }}>
                        <Label style={{ display: 'inline-flex', flexDirection: 'row', alignItems: 'center' }}>
                            <span>
                                筛选器
                            </span>
                            <div
                                style={{
                                    display: 'flex',
                                    padding: '0 2em',
                                }}
                            >
                                <FilterCreationPill
                                    fields={fieldMetas}
                                    onFilterSubmit={(_, filter) => setFilters(list => [...list, filter])}
                                />
                            </div>
                        </Label>
                        {filters.length > 0 && (
                            <div
                                style={{
                                    display: 'flex',
                                    flexDirection: 'row',
                                    overflow: 'auto hidden',
                                    margin: '1em 0',
                                }}
                            >
                                {filters.map((filter, i) => {
                                    const field = fieldMetas.find(f => f.fid === filter.fid);

                                    return field ? (
                                        <FilterCell key={i} field={field} data={filter} remove={() => setFilters(list => {
                                            return produce(list, draft => {
                                                draft.splice(i, 1);
                                            });
                                        })} />
                                    ) : null;
                                })}
                            </div>
                        )}
                        <small style={{ color: '#666', display: 'flex', alignItems: 'center' }}>
                            {`${filters.length ? `筛选后子集大小: ${dataSubset.length} 行` : '(无筛选项)'}`}
                        </small>
                    </Stack>
                    <Stack style={{ marginBlock: '1.6em', alignItems: 'flex-end' }} horizontal>
                        <ComboBox
                            multiSelect
                            selectedKey={focusFieldIds}
                            label="需要分析的字段"
                            allowFreeform
                            options={focusFieldsOption}
                            onChange={(e, option) => {
                                if (option) {
                                    const { key, selected } = option;
                                    if (focusFieldIds.includes(key as string) && !selected) {
                                        // setFocusFields((list) => list.filter((f) => f !== key));
                                        causalStore.setFocusFieldIds(focusFieldIds.filter((f) => f !== key));
                                    } else if (!focusFieldIds.includes(key as string) && selected) {
                                        causalStore.setFocusFieldIds([...focusFieldIds, key as string]);
                                    }
                                }
                            }}
                            styles={{
                                container: {
                                    flexGrow: 1,
                                    flexShrink: 1,
                                },
                            }}
                        />
                        <DefaultButton
                            style={{ fontSize: '0.8rem' }}
                            onClick={() =>
                                causalStore.setFocusFieldIds(
                                    fieldMetas.filter((f) => f.disable !== true).map((f) => f.fid)
                                )
                            }
                        >
                            全部选择
                        </DefaultButton>
                        <DefaultButton
                            style={{ fontSize: '0.8rem' }}
                            onClick={() =>
                                causalStore.setFocusFieldIds(
                                    fieldMetas
                                        .filter((f) => f.disable !== true)
                                        .slice(0, 10)
                                        .map((f) => f.fid)
                                )
                            }
                        >
                            选择前十条（默认）
                        </DefaultButton>
                        <DefaultButton style={{ fontSize: '0.8rem' }} onClick={() => causalStore.setFocusFieldIds([])}>
                            清空选择
                        </DefaultButton>
                    </Stack>
                </InnerCard>
                <InnerCard>
                    <h1 className="card-header">领域/背景知识</h1>
                    <hr className="card-line" />
                    <Stack tokens={{ childrenGap: 12 }}>
                        <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center' }}>
                            <PrimaryButton
                                onClick={() => setModifiablePrecondition(getGeneratedPreconditionsFromIGMat())}
                            >
                                相关性分析
                            </PrimaryButton>
                            <div style={{ flex: 1, display: 'flex', alignItems: 'center', margin: '0 2em', borderLeft: '1px solid #888a', paddingLeft: '2em' }}>
                                <Label style={{ width: '20%' }}>添加影响关系</Label>
                                <Dropdown
                                    placeholder="Source"
                                    selectedKey={editingPrecondition.src ?? 'none'}
                                    onChange={(e, option) => {
                                        if (!option) {
                                            return;
                                        }
                                        const fid = option.key as string;
                                        setEditingPrecondition(p => ({
                                            type: p.type,
                                            src: fid,
                                            tar: p.tar === fid ? undefined : p.tar,
                                        }));
                                    }}
                                    options={selectedFields.map(f => ({
                                        key: f.fid,
                                        text: f.name ?? f.fid,
                                    }))}
                                    styles={{ root: { width: '30%' } }}
                                />
                                <Dropdown
                                    placeholder="Direction"
                                    selectedKey={editingPrecondition.type}
                                    onChange={(e, option) => {
                                        if (!option) {
                                            return;
                                        }
                                        setEditingPrecondition(p => ({
                                            ...p,
                                            type: option.key as (typeof p)['type'],
                                        }));
                                    }}
                                    options={[
                                        { key: 'must-link', text: '一定相连' },
                                        { key: 'must-not-link', text: '一定不相连' },
                                        { key: 'prefer-link', text: '有相连倾向' },
                                    ]}
                                    styles={{ root: { width: '20%' }, title: { textAlign: 'center' } }}
                                />
                                <Dropdown
                                    placeholder="Target"
                                    selectedKey={editingPrecondition.tar ?? 'none'}
                                    onChange={(e, option) => {
                                        if (!option) {
                                            return;
                                        }
                                        const fid = option.key as string;
                                        setEditingPrecondition(p => ({
                                            type: p.type,
                                            tar: fid,
                                            src: p.src === fid ? undefined : p.src,
                                        }));
                                    }}
                                    options={selectedFields.map(f => ({
                                        key: f.fid,
                                        text: f.name ?? f.fid,
                                    }))}
                                    styles={{ root: { width: '30%' } }}
                                />
                                <ActionButton
                                    styles={{
                                        root: {
                                            width: '10%',
                                        }
                                    }}
                                    iconProps={{
                                        iconName: 'Add',
                                    }}
                                    onClick={() => {
                                        if (editingPrecondition.src && editingPrecondition.tar && editingPrecondition.type && editingPrecondition.src !== editingPrecondition.tar) {
                                            setEditingPrecondition({ type: editingPrecondition.type });
                                            setModifiablePrecondition(list => [...list, editingPrecondition as ModifiableBgKnowledge]);
                                        }
                                    }}
                                />
                            </div>
                        </div>
                        <DetailsList
                            items={modifiablePrecondition}
                            columns={preconditionTableCols}
                            selectionMode={SelectionMode.none}
                            styles={{
                                root: {
                                    width: 'max-content',
                                    maxWidth: '100%',
                                    height: '30vh',
                                    overflow: 'auto',
                                    whiteSpace: 'nowrap',
                                    fontSize: '0.8rem',
                                }
                            }}
                        />
                    </Stack>
                </InnerCard>

                <Stack tokens={{ childrenGap: '1em' }} horizontal style={{ marginTop: '1em' }}>
                    <ModelStorage />
                    <Params dataSource={dataSubset} focusFields={focusFieldIds} precondition={precondition} />
                </Stack>
                <MatrixPanel
                    fields={selectedFields}
                    dataSource={dataSubset}
                    onMatrixPointClick={onFieldGroupSelect}
                    onCompute={(matKey) => {
                        switch (matKey) {
                            case MATRIX_TYPE.conditionalMutualInfo:
                                causalStore.computeIGCondMatrix(dataSubset, selectedFields);
                                break;
                            case MATRIX_TYPE.causal:
                                causalStore.causalDiscovery(dataSubset, precondition);
                                break;
                            case MATRIX_TYPE.mutualInfo:
                            default:
                                causalStore.computeIGMatrix(dataSubset, selectedFields);
                                break;
                        }
                    }}
                />
                <div>
                    {!computing ? (
                        <Explorer
                            dataSource={dataSubset}
                            fields={exploringFields}
                            scoreMatrix={igMatrix}
                            preconditions={modifiablePrecondition}
                            onNodeSelected={handleSubTreeSelected}
                            onLinkTogether={(srcIdx, tarIdx) =>
                                setModifiablePrecondition((list) => [
                                    ...list,
                                    {
                                        src: exploringFields[srcIdx].fid,
                                        tar: exploringFields[tarIdx].fid,
                                        type: 'must-link',
                                    },
                                ])
                            }
                            onRemoveLink={(srcIdx, tarIdx) =>
                                setModifiablePrecondition((list) => {
                                    return list.filter((link) => !(link.src === srcIdx && link.tar === tarIdx));
                                })
                            }
                        />
                    ) : null}
                    {computing && <Spinner label="computing" />}
                </div>
            </div>
            <div className="card">
                <Pivot
                    style={{ marginBottom: '1em' }}
                    selectedKey={customAnalysisMode}
                    onLinkClick={(item) => {
                        item && setCustomAnalysisMode(item.props.itemKey as 'crossFilter' | 'graphicWalker');
                    }}
                >
                    <PivotItem itemKey="crossFilter" headerText="因果验证/探索" />
                    <PivotItem itemKey="graphicWalker" headerText="可视化自助分析" />
                </Pivot>
                <Stack horizontal>
                    <SemiEmbed
                        fields={fieldGroup}
                        show={showSemiClue}
                        toggleShow={() => {
                            setShowSemiClue((v) => !v);
                        }}
                    />
                    {customAnalysisMode === 'crossFilter' && (
                        <ActionButton
                            iconProps={{ iconName: 'Delete' }}
                            text="清除选择字段"
                            disabled={fieldGroup.length === 0}
                            onClick={clearFieldGroup}
                        />
                    )}
                </Stack>
                {customAnalysisMode === 'crossFilter' && vizSampleData.length > 0 && fieldGroup.length > 0 && (
                    <CrossFilter fields={fieldGroup} dataSource={vizSampleData} />
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
        </div>
    );
};

export default observer(CausalPage);
