import { ActionButton, ComboBox, DefaultButton, Dropdown, Label, List, PrimaryButton, Slider, Spinner, Stack } from '@fluentui/react';
import { observer } from 'mobx-react-lite';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { GraphicWalker } from '@kanaries/graphic-walker';
import { applyFilters } from '@kanaries/loa';
import produce from 'immer';
import type { Specification } from 'visual-insights';
import { IFieldMeta, IFilter } from '../../interfaces';
import { useGlobalStore } from '../../store';
import { viewSampling, baseDemoSample } from '../painter/sample';
import FilterCreationPill from '../../components/filterCreationPill';
import LaTiaoConsole from '../dataSource/LaTiaoConsole';
import SemiEmbed from '../semiAutomation/semiEmbed';
import Explorer from './explorer';
import CrossFilter from './crossFilter';
import Params from './params';
import RelationMatrixHeatMap from './relationMatrixHeatMap';
import { NodeWithScore } from './explorer/flowAnalyzer';
import type { BgKnowledge, ModifiableBgKnowledge } from './config';
import { FilterCell } from './filters';
import ModelStorage from './modelStorage';

const VIZ_SUBSET_LIMIT = 2_000;

const CausalPage: React.FC = () => {
    const { dataSourceStore, causalStore, langStore } = useGlobalStore();
    const { fieldMetas, cleanedData } = dataSourceStore;
    const [fieldGroup, setFieldGroup] = useState<IFieldMeta[]>([]);
    const { igMatrix, causalFields, causalStrength, computing } = causalStore;
    
    const [focusFields, setFocusFields] = useState<string[]>([]);
    const [editingPrecondition, setEditingPrecondition] = useState<Partial<ModifiableBgKnowledge>>({ type: 'must-link' });
    const [modifiablePrecondition, setModifiablePrecondition] = useState<ModifiableBgKnowledge[]>([]);

    const selectedFields = useMemo(() => focusFields.map(fid => fieldMetas.find(f => f.fid === fid)!).filter(Boolean), [focusFields, fieldMetas]);

    const precondition = useMemo<BgKnowledge[]>(() => {
        if (computing || igMatrix.length !== selectedFields.length) {
            return [];
        }
        return modifiablePrecondition.reduce<BgKnowledge[]>((list, decl) => {
            const srcIdx = selectedFields.findIndex(f => f.fid === decl.src);
            const tarIdx = selectedFields.findIndex(f => f.fid === decl.tar);

            if (srcIdx !== -1 && tarIdx !== -1) {
                list.push({
                    src: decl.src,
                    tar: decl.tar,
                    type: decl.type === 'must-link' ? 1
                        : decl.type === 'must-not-link' ? -1
                        : (igMatrix[srcIdx][tarIdx] + 1) / 2,   // TODO: 暂时定为一半
                });
            }

            return list;
        }, []);
    }, [igMatrix, modifiablePrecondition, selectedFields, computing]);

    const [sampleRate, setSampleRate] = useState(1);
    const [appliedSampleRate, setAppliedSampleRate] = useState(sampleRate);
    const [filters, setFilters] = useState<IFilter[]>([]);
    const dataSource = useMemo(() => {
        if (appliedSampleRate >= 1) {
            return cleanedData;
        }
        const sampleSize = Math.round(cleanedData.length * appliedSampleRate);
        // console.log({sampleSize});
        return baseDemoSample(cleanedData, sampleSize);
        // return viewSampling(cleanedData, selectedFields, sampleSize); // FIXME: 用这个，但是有问题只能得到 0 / full ？
    }, [cleanedData/*, selectedFields*/, appliedSampleRate]);
    const dataSubset = useMemo(() => {
        return applyFilters(dataSource, filters);
    }, [dataSource, filters]);
    const vizSampleData = useMemo(() => {
        if (dataSubset.length < VIZ_SUBSET_LIMIT) {
            return dataSubset;
        }
        return baseDemoSample(dataSubset, VIZ_SUBSET_LIMIT);
    }, [dataSubset]);

    useEffect(() => {
        if (sampleRate !== appliedSampleRate) {
            const delayedTask = setTimeout(() => {
                setAppliedSampleRate(sampleRate);
            }, 1_000);
    
            return () => {
                clearTimeout(delayedTask);
            };
        }
    }, [sampleRate, appliedSampleRate]);

    useEffect(() => {
        setFocusFields(
            fieldMetas.filter(f => f.disable !== true).slice(0, 10).map(f => f.fid) // 默认只使用前 10 个
        );
        setEditingPrecondition({ type: 'must-link' });
    }, [fieldMetas]);

    const getGeneratedPreconditionsFromIGMat = useCallback(() => {
        const initLinks: ModifiableBgKnowledge[] = [];
        const mat = igMatrix;
        // TODO: 临时定的阈值
        const thresholdFalse = 0.01;
        const thresholdPrefer = 0.1;
        if (mat.length === selectedFields.length) {
            for (let i = 0; i < mat.length - 1; i += 1) {
                for (let j = i + 1; j < mat.length; j += 1) {
                    const wf = mat[i][j];
                    const wb = mat[j][i];
                    if (wf + wb < thresholdFalse) {
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

    useEffect(() => {
        causalStore.computeIGMatrix(dataSubset, selectedFields);
    }, [selectedFields, dataSubset, causalStore]);

    // useEffect(() => {
    //     causalStore.computeIGCondMatrix(dataSubset, fieldMetas);
    // }, [fieldMetas, dataSubset, causalStore]);

    const onFieldGroupSelect = useCallback(
        (xFid: string, yFid: string) => {
            causalStore.setFocusNodeIndex(fieldMetas.findIndex(f => f.fid === xFid));
            setFieldGroup((group) => {
                const nextGroup = [...group];
                if (!nextGroup.find((f) => f.fid === xFid)) {
                    nextGroup.push(fieldMetas.find((f) => f.fid === xFid)!);
                }
                if (!nextGroup.find((f) => f.fid === yFid)) {
                    nextGroup.push(fieldMetas.find((f) => f.fid === yFid)!);
                }
                return nextGroup;
            });
        },
        [setFieldGroup, fieldMetas, causalStore]
    );

    // const compareMatrix = useMemo(() => {
    //     const ans: number[][] = [];
    //     for (let i = 0; i < igMatrix.length; i++) {
    //         ans.push([]);
    //         for (let j = 0; j < igMatrix[i].length; j++) {
    //             ans[i].push(igMatrix[i][j] - igMatrix[j][i]);
    //         }
    //     }
    //     return ans;
    // }, [igMatrix]);

    const handleSubTreeSelected = useCallback((
        node: Readonly<IFieldMeta> | null,
        simpleCause: readonly Readonly<NodeWithScore>[],
        simpleEffect: readonly Readonly<NodeWithScore>[],
        composedCause: readonly Readonly<NodeWithScore>[],
        composedEffect: readonly Readonly<NodeWithScore>[],
    ) => {
        if (node) {
            const allEffect = composedEffect.reduce<Readonly<NodeWithScore>[]>((list, f) => {
                if (!list.some(which => which.field.fid === f.field.fid)) {
                    list.push(f);
                }
                return list;
            }, [...simpleEffect]).sort((a, b) => b.score - a.score);
            // console.log(allEffect)
            setFieldGroup([
                node,
                ...allEffect.map(f => f.field),
            ]);
        }
    }, []);

    const focusFieldsOption = useMemo(() => fieldMetas.map(f => ({
        key: f.fid,
        text: f.name ?? f.fid,
    })), [fieldMetas]);

    const initialSpec = useMemo<Specification>(() => {
        const [discreteChannel, concreteChannel] = fieldGroup.reduce<[IFieldMeta[], IFieldMeta[]]>(([discrete, concrete], f, i) => {
            if (i === 0 || f.semanticType === 'quantitative' || f.semanticType === 'temporal') {
                concrete.push(f);
            } else {
                discrete.push(f);
            }
            return [discrete, concrete];
        }, [[], []]);
        return fieldGroup.length ? {
            position: concreteChannel.map(f => f.fid),
            color: discreteChannel[0] ? [discreteChannel[0].fid] : [],
            size: discreteChannel[1] ? [discreteChannel[1].fid] : [],
            opacity: discreteChannel[2] ? [discreteChannel[2].fid] : [],
        } : {};
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

    return (
        <div className="content-container">
            <div className="card">
                <Label>Causal Analysis</Label>
                <Stack style={{ marginBlock: '1.6em' }}>
                    <Slider
                        label={`Sample Rate (origin size = ${cleanedData.length} rows, sample size = ${dataSource.length} rows)`}
                        min={0.01}
                        max={1}
                        step={0.01}
                        value={sampleRate}
                        showValue
                        onChange={val => setSampleRate(val)}
                    />
                    {sampleRate !== appliedSampleRate && <Spinner label="Synchronizing settings..." />}
                </Stack>
                <Stack style={{ marginBlock: '1.6em' }}>
                    <Label>
                        {`Filters ${filters.length ? `(subset size: ${dataSubset.length} rows)` : '(no filters applied)'}`}
                    </Label>
                    <div
                        style={{
                            display: 'flex',
                            paddingBlock: '0.5em',
                        }}
                    >
                        <FilterCreationPill
                            fields={fieldMetas}
                            onFilterSubmit={(_, filter) => setFilters(list => [...list, filter])}
                        />
                    </div>
                    <div
                        style={{
                            display: 'flex',
                            flexDirection: 'row',
                            overflow: 'auto hidden',
                            marginTop: '1em',
                            padding: '0.8em',
                            border: '1px solid #8884',
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
                </Stack>
                <Stack style={{ marginBlock: '1.6em', alignItems: 'flex-end' }} horizontal >
                    <ComboBox
                        multiSelect
                        selectedKey={focusFields}
                        label="Fields to Analyze"
                        allowFreeform
                        options={focusFieldsOption}
                        onChange={(e, option) => {
                            if (option) {
                                const { key, selected } = option;
                                if (focusFields.includes(key as string) && !selected) {
                                    setFocusFields(list => list.filter(f => f !== key));
                                } else if (!focusFields.includes(key as string) && selected) {
                                    setFocusFields(list => [...list, key as string]);
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
                    <DefaultButton onClick={() => setFocusFields(fieldMetas.filter(f => f.disable !== true).map(f => f.fid))}>
                        Select All
                    </DefaultButton>
                    <DefaultButton onClick={() => setFocusFields(fieldMetas.filter(f => f.disable !== true).slice(0, 10).map(f => f.fid))} >
                        Select First 10 Columns
                    </DefaultButton>
                    <DefaultButton onClick={() => setFocusFields([])} >
                        Clear All
                    </DefaultButton>
                </Stack>
                <Stack style={{ marginBlock: '1.6em 3.2em' }}>
                    <Label>Conditions (Background Knowledge)</Label>
                    <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center' }}>
                        <PrimaryButton
                            onClick={() => setModifiablePrecondition(getGeneratedPreconditionsFromIGMat())}
                        >
                            Auto Initialize
                        </PrimaryButton>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center' }}>
                        <Label style={{ width: '20%' }}>Add Condition</Label>
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
                                { key: 'must-link', text: 'True' },
                                { key: 'must-not-link', text: 'False' },
                                { key: 'prefer-link', text: 'Prefer True' },
                            ]}
                            styles={{ root: { width: '10%' }, caretDownWrapper: { display: 'none' }, title: { padding: '0 8px', textAlign: 'center' } }}
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
                    <List
                        items={modifiablePrecondition}
                        onRenderCell={(item, i) => item ? (
                            <div data-is-focusable={true} style={{ display: 'flex', flexDirection: 'row', alignItems: 'center' }}>
                                <span style={{ width: '30%', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                    {fieldMetas.find(f => f.fid === item.src)?.name ?? item.src}
                                </span>
                                <span style={{ width: '20%' }}>
                                    {({
                                        'must-link': 'must link',
                                        'must-not-link': 'must not link',
                                        'prefer-link': 'prefer to link'
                                    } as const)[item.type]}
                                </span>
                                <span style={{ width: '30%', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                    {fieldMetas.find(f => f.fid === item.tar)?.name ?? item.tar}
                                </span>
                                <ActionButton
                                    styles={{
                                        root: {
                                            width: '10%',
                                        }
                                    }}
                                    iconProps={{
                                        iconName: 'Delete',
                                    }}
                                    onClick={() => {
                                        if (typeof i === 'number') {
                                            setModifiablePrecondition(list => {
                                                const next = [...list];
                                                next.splice(i, 1);
                                                return next;
                                            });
                                        }
                                    }}
                                />
                            </div>
                        ) : null}
                        style={{
                            border: '1px solid #888',
                            padding: '1em 2em',
                            maxHeight: '30vh',
                            overflow: 'auto',
                        }}
                    />
                </Stack>
                <Stack tokens={{ childrenGap: '1em' }} horizontal style={{ marginTop: '1em' }}>
                    <DefaultButton text="Clear Group" onClick={() => setFieldGroup([])} />
                    <PrimaryButton
                        text="Causal Discovery"
                        onClick={() => {
                            causalStore.causalDiscovery(
                                dataSubset,
                                fieldMetas,
                                focusFields,
                                precondition
                            );
                        }}
                    />
                    <ModelStorage />
                    <LaTiaoConsole />
                    <Params dataSource={dataSubset} focusFields={focusFields} precondition={precondition} />
                </Stack>

                <div style={{ marginTop: '1em', display: 'flex' }}>
                    <div>
                        {dataSubset.length > 0 && igMatrix.length > 0 && selectedFields.length === igMatrix.length && (
                            <RelationMatrixHeatMap
                                absolute
                                fields={selectedFields}
                                data={igMatrix}
                                onSelect={onFieldGroupSelect}
                            />
                        )}
                    </div>
                    {/* <div>
                        {dataSubset.length > 0 && !computing && (
                            <RelationMatrixHeatMap
                                absolute
                                fields={fieldMetas}
                                data={igCondMatrix}
                                onSelect={onFieldGroupSelect}
                            />
                        )}
                        {computing && <Spinner label="computings" />}
                    </div> */}
                    <div>
                        {dataSubset.length > 0 && causalStrength.length && causalStrength.length === causalFields.length &&
                            !computing ? (
                                <RelationMatrixHeatMap
                                    // absolute
                                    fields={causalFields}
                                    data={causalStrength}
                                    // onSelect={onFieldGroupSelect}
                                />
                            ) : null}
                        {computing && <Spinner label="computings" />}
                    </div>
                </div>
                {/* <div>
                    {dataSubset.length > 0 &&
                        causalStrength.length > 0 &&
                        causalStrength.length === fieldMetas.length &&
                        !computing && (
                            <RelationTree
                                matrix={causalStrength}
                                fields={fieldMetas}
                                focusIndex={causalStore.focusNodeIndex}
                                onFocusChange={(index) => {
                                    causalStore.setFocusNodeIndex(index);
                                }}
                            />
                        )}
                </div> */}
                <div>
                    {
                        !computing ? (
                            <Explorer
                                dataSource={dataSubset}
                                fields={exploringFields}
                                scoreMatrix={igMatrix}
                                preconditions={modifiablePrecondition}
                                onNodeSelected={handleSubTreeSelected}
                                onLinkTogether={(srcIdx, tarIdx) => setModifiablePrecondition(list => [
                                    ...list,
                                    {
                                        src: exploringFields[srcIdx].fid,
                                        tar: exploringFields[tarIdx].fid,
                                        type: 'must-link',
                                    },
                                ])}
                            />
                        ) : null
                    }
                    {computing && <Spinner label="computings" />}
                </div>
                <hr style={{ margin: '1em' }} />
                <div>
                    {vizSampleData.length > 0 && fieldGroup.length > 0 && (
                        <CrossFilter fields={fieldGroup} dataSource={vizSampleData} />
                    )}
                </div>
                <SemiEmbed fields={fieldGroup} />
                <div>
                    {/* 小心这里的内存占用 */}
                    <GraphicWalker
                        dataSource={vizSampleData}
                        rawFields={fieldMetas}
                        hideDataSourceConfig
                        spec={initialSpec}
                        i18nLang={langStore.lang}
                        keepAlive={false}
                    />
                </div>
            </div>
        </div>
    );
};

export default observer(CausalPage);
