import { ActionButton, ComboBox, DefaultButton, Dropdown, Label, List, PrimaryButton, Slider, Spinner, Stack } from '@fluentui/react';
import { observer } from 'mobx-react-lite';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { GraphicWalker } from '@kanaries/graphic-walker';
import type { Specification } from 'visual-insights';
import { IFieldMeta } from '../../interfaces';
import { useGlobalStore } from '../../store';
import { viewSampling } from '../painter/sample';
import LaTiaoConsole from '../dataSource/LaTiaoConsole';
import Explorer from './explorer';
import SemiEmbed from '../semiAutomation/semiEmbed';
import CrossFilter from './crossFilter';
import Params from './params';
import RelationMatrixHeatMap from './relationMatrixHeatMap';
// import RelationTree from './tree';
import { NodeWithScore } from './explorer/flowAnalyzer';
import type { BgKnowledge } from './config';

const CausalPage: React.FC = () => {
    const { dataSourceStore, causalStore, langStore } = useGlobalStore();
    const { fieldMetas, cleanedData } = dataSourceStore;
    const [fieldGroup, setFieldGroup] = useState<IFieldMeta[]>([]);
    const { igMatrix, causalStrength, curAlgo, causalFields, computing } = causalStore;
    
    const [focusFields, setFocusFields] = useState<string[]>([]);
    const [editingPrecondition, setEditingPrecondition] = useState<Partial<BgKnowledge>>({ type: 'directed' });
    const [precondition, setPrecondition] = useState<BgKnowledge[]>([]);

    const selectedFields = useMemo(() => focusFields.map(fid => fieldMetas.find(f => f.fid === fid)!).filter(Boolean), [focusFields, fieldMetas]);

    const [sampleRate, setSampleRate] = useState(1);
    const [appliedSampleRate, setAppliedSampleRate] = useState(sampleRate);
    const dataSource = useMemo(() => {
        if (appliedSampleRate >= 1) {
            return cleanedData;
        }
        const sampleSize = Math.round(cleanedData.length * appliedSampleRate);
        // console.log({sampleSize});
        return viewSampling(cleanedData, selectedFields, sampleSize);
    }, [cleanedData, selectedFields, appliedSampleRate]);

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
        setFocusFields(fieldMetas.filter(f => f.disable !== true).map(f => f.fid));
        setPrecondition(
            fieldMetas.reduce<BgKnowledge[]>((list, f) => {
                if (f.extInfo) {
                    for (const from of f.extInfo.extFrom) {
                        list.push({
                            src: from,
                            tar: f.fid,
                            type: 'directed',
                        });
                    }
                }
                return list;
            }, [])
        );
        setEditingPrecondition({ type: 'directed' });
    }, [fieldMetas]);

    useEffect(() => {
        causalStore.updateCausalAlgorithmList(fieldMetas);
    }, [causalStore, fieldMetas]);

    useEffect(() => {
        causalStore.computeIGMatrix(dataSource, focusFields.map(fid => fieldMetas.find(f => f.fid === fid)!));
    }, [fieldMetas, focusFields, dataSource, causalStore]);

    // useEffect(() => {
    //     causalStore.computeIGCondMatrix(dataSource, fieldMetas);
    // }, [fieldMetas, dataSource, causalStore]);

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

    const gwEditedRef = useRef(false);

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
                    <ComboBox
                        multiSelect
                        selectedKey={focusFields}
                        label="Selected Fields"
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
                    />
                </Stack>
                <Stack style={{ marginBlock: '1.6em 3.2em' }}>
                    <Label>Conditions (Background Knowledge)</Label>
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
                            options={fieldMetas.map(f => ({
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
                                { key: 'directed', text: '-->' },
                                { key: 'bidirected', text: '<->' },
                                { key: 'undirected', text: '---' },
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
                            options={fieldMetas.map(f => ({
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
                                    setPrecondition(list => [...list, editingPrecondition as BgKnowledge]);
                                }
                            }}
                        />
                    </div>
                    <List
                        items={precondition}
                        onRenderCell={(item, i) => item ? (
                            <div data-is-focusable={true} style={{ display: 'flex', flexDirection: 'row', alignItems: 'center' }}>
                                <span style={{ width: '30%', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                    {fieldMetas.find(f => f.fid === item.src)?.name ?? item.src}
                                </span>
                                <span style={{ width: '20%' }}>
                                    {({
                                        directed: '----->',
                                        bidirected: '<---->',
                                        undirected: '------'
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
                                            setPrecondition(list => {
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
                                dataSource,
                                fieldMetas,
                                focusFields,
                                precondition,
                                causalStore.causalAlgorithm
                            );
                        }}
                    />
                    <LaTiaoConsole />
                    <Params dataSource={dataSource} focusFields={focusFields} precondition={precondition} />
                </Stack>

                <div style={{ marginTop: '1em', display: 'flex' }}>
                    <div>
                        {dataSource.length > 0 && igMatrix.length > 0 && selectedFields.length === igMatrix.length && (
                            <RelationMatrixHeatMap
                                absolute
                                fields={selectedFields}
                                data={igMatrix}
                                onSelect={onFieldGroupSelect}
                            />
                        )}
                    </div>
                    {/* <div>
                        {dataSource.length > 0 && !computing && (
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
                        {dataSource.length > 0 &&
                            causalStrength.length > 0 &&
                            causalStrength.length === causalFields.length &&
                            !computing && (
                                <RelationMatrixHeatMap
                                    
                                    // absolute
                                    fields={causalFields}
                                    data={causalStrength}
                                    // onSelect={onFieldGroupSelect}
                                />
                            )}
                        {computing && <Spinner label="computings" />}
                    </div>
                </div>
                {/* <div>
                    {dataSource.length > 0 &&
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
                    {dataSource.length > 0 &&
                        causalStrength.length > 0 &&
                        causalStrength.length === causalFields.length &&
                        causalStrength.length === igMatrix.length &&
                        !computing ? (
                            <Explorer
                                dataSource={dataSource}
                                fields={causalFields}
                                scoreMatrix={igMatrix}
                                causalMatrix={causalStrength}
                                curAlgo={curAlgo}
                                preconditions={precondition}
                                onNodeSelected={handleSubTreeSelected}
                                onLinkTogether={(srcIdx, tarIdx) => setPrecondition(list => [
                                    ...list,
                                    {
                                        src: causalFields[srcIdx].fid,
                                        tar: causalFields[tarIdx].fid,
                                        type: 'directed',
                                    },
                                ])}
                            />
                        ) : null
                    }
                    {computing && <Spinner label="computings" />}
                </div>

                <div>
                    {dataSource.length > 0 && fieldGroup.length > 0 && (
                        <CrossFilter fields={fieldGroup} dataSource={dataSource} />
                    )}
                </div>
                <SemiEmbed fields={fieldGroup} />
                <div>
                    <GraphicWalker
                        dataSource={dataSource}
                        rawFields={fieldMetas}
                        hideDataSourceConfig
                        spec={gwEditedRef.current ? undefined : initialSpec}
                        i18nLang={langStore.lang}
                        keepAlive
                    />
                </div>
            </div>
        </div>
    );
};

export default observer(CausalPage);
