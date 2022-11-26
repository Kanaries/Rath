import { Checkbox, DefaultButton, DetailsList, Dropdown, IColumn, Icon, Label, Pivot, PivotItem, SelectionMode, Spinner } from "@fluentui/react";
import produce from "immer";
import { observer } from "mobx-react-lite";
import { nanoid } from "nanoid";
import { FC, useCallback, useEffect, useMemo, useRef, useState } from "react";
import styled from "styled-components";
import type { IFieldMeta } from "../../interfaces";
import { useGlobalStore } from "../../store";
import { execPredict, IPredictResult, PredictAlgorithm, PredictAlgorithms, TrainTestSplitFlag } from "./predict";


const Container = styled.div`
    flex-grow: 1;
    flex-shrink: 1;
    display: flex;
    flex-direction: column;
    overflow: hidden;
    > .content {
        flex-grow: 1;
        flex-shrink: 1;
        display: flex;
        flex-direction: column;
        padding: 0.5em;
        overflow: auto;
        > * {
            flex-grow: 0;
            flex-shrink: 0;
        }
    }
`;

const TableContainer = styled.div`
    flex-grow: 0;
    flex-shrink: 0;
    overflow: auto;
`;

const Row = styled.div<{ selected: 'attribution' | 'target' | false }>`
    > div {
        background-color: ${({ selected }) => (
            selected === 'attribution' ? 'rgba(194,132,2,0.2)' : selected === 'target' ? 'rgba(66,121,242,0.2)' : undefined
        )};
        filter: ${({ selected }) => selected ? 'unset' : 'opacity(0.8)'};
        cursor: pointer;
        :hover {
            filter: unset;
        }
    }
`;

// FIXME: 防止切到别的流程时预测结果被清空，先在全局存一下，决定好要不要保留 && 状态应该存哪里以后及时迁走
const predictCache: {
    id: string; algo: PredictAlgorithm; startTime: number; completeTime: number; data: IPredictResult;
}[] = [];

const PredictPanel: FC = () => {
    const { causalStore, dataSourceStore } = useGlobalStore();
    const { selectedFields } = causalStore;
    const { cleanedData, fieldMetas } = dataSourceStore;

    const [predictInput, setPredictInput] = useState<{ features: IFieldMeta[]; targets: IFieldMeta[] }>({
        features: [],
        targets: [],
    });
    const [algo, setAlgo] = useState<PredictAlgorithm>('decisionTree');

    useEffect(() => {
        setPredictInput(before => {
            if (before.features.length || before.targets.length) {
                return {
                    features: selectedFields.filter(f => before.features.some(feat => feat.fid === f.fid)),
                    targets: selectedFields.filter(f => before.targets.some(tar => tar.fid === f.fid)),
                };
            }
            return {
                features: selectedFields.slice(1).map(f => f),
                targets: selectedFields.slice(0, 1),
            };
        });
    }, [selectedFields]);

    const [running, setRunning] = useState(false);

    const fieldsTableCols = useMemo<IColumn[]>(() => {
        return [
            {
                key: 'selectedAsFeature',
                name: `特征 (${predictInput.features.length} / ${selectedFields.length})`,
                onRender: (item) => {
                    const field = item as IFieldMeta;
                    const checked = predictInput.features.some(f => f.fid === field.fid);
                    return (
                        <Checkbox
                            checked={checked}
                            disabled={running}
                            onChange={(_, ok) => {
                                if (running) {
                                    return;
                                }
                                setPredictInput(produce(predictInput, draft => {
                                    draft.features = draft.features.filter(f => f.fid !== field.fid);
                                    draft.targets = draft.targets.filter(f => f.fid !== field.fid);
                                    if (ok) {
                                        draft.features.push(field);
                                    }
                                }));
                            }}
                        />
                    );
                },
                isResizable: false,
                minWidth: 90,
                maxWidth: 90,
            },
            {
                key: 'selectedAsTarget',
                name: `目标 (${predictInput.targets.length} / ${selectedFields.length})`,
                onRender: (item) => {
                    const field = item as IFieldMeta;
                    const checked = predictInput.targets.some(f => f.fid === field.fid);
                    return (
                        <Checkbox
                            checked={checked}
                            disabled={running}
                            onChange={(_, ok) => {
                                if (running) {
                                    return;
                                }
                                setPredictInput(produce(predictInput, draft => {
                                    draft.features = draft.features.filter(f => f.fid !== field.fid);
                                    draft.targets = draft.targets.filter(f => f.fid !== field.fid);
                                    if (ok) {
                                        draft.targets.push(field);
                                    }
                                }));
                            }}
                        />
                    );
                },
                isResizable: false,
                minWidth: 90,
                maxWidth: 90,
            },
            {
                key: 'name',
                name: '因素',
                onRender: (item) => {
                    const field = item as IFieldMeta;
                    return (
                        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {field.name || field.fid}
                        </span>
                    );
                },
                minWidth: 120,
            },
        ];
    }, [selectedFields, predictInput, running]);

    const canExecute = predictInput.features.length > 0 && predictInput.targets.length > 0;
    const pendingRef = useRef<Promise<unknown>>();

    useEffect(() => {
        pendingRef.current = undefined;
        setRunning(false);
    }, [predictInput]);

    const dataSourceRef = useRef(cleanedData);
    dataSourceRef.current = cleanedData;
    const allFieldsRef = useRef(fieldMetas);
    allFieldsRef.current = fieldMetas;

    const [results, setResults] = useState<{
        id: string; algo: PredictAlgorithm; startTime: number; completeTime: number; data: IPredictResult;
    }[]>([]);

    // FIXME: 防止切到别的流程时预测结果被清空，先在全局存一下，决定好要不要保留 && 状态应该存哪里以后及时迁走
    useEffect(() => {
        setResults(predictCache);
        return () => {
            setResults(res => {
                predictCache.splice(0, Infinity, ...res);
                return [];
            });
        };
    }, [cleanedData, fieldMetas]);

    const [tab, setTab] = useState<'config' | 'result'>('config');

    const trainTestSplitIndices = useMemo<TrainTestSplitFlag[]>(() => {
        const TRAIN_RATE = 0.2;
        const indices = cleanedData.map((_, i) => i);
        const trainSetIndices = new Map<number, 1>();
        const trainSetTargetSize = Math.floor(cleanedData.length * TRAIN_RATE);
        while (trainSetIndices.size < trainSetTargetSize && indices.length) {
            const [index] = indices.splice(Math.floor(indices.length * Math.random()), 1);
            trainSetIndices.set(index, 1);
        }
        return cleanedData.map((_, i) => trainSetIndices.has(i) ? TrainTestSplitFlag.train : TrainTestSplitFlag.test);
    }, [cleanedData]);

    const trainTestSplitIndicesRef = useRef(trainTestSplitIndices);
    trainTestSplitIndicesRef.current = trainTestSplitIndices;

    const handleClickExec = useCallback(() => {
        const startTime = Date.now();
        setRunning(true);
        const task = execPredict({
            dataSource: dataSourceRef.current,
            fields: allFieldsRef.current,
            model: {
                algorithm: algo,
                features: predictInput.features.map(f => f.fid),
                targets: predictInput.targets.map(f => f.fid),
            },
            trainTestSplitIndices: trainTestSplitIndicesRef.current,
        });
        pendingRef.current = task;
        task.then(res => {
            if (task === pendingRef.current && res) {
                const completeTime = Date.now();
                setResults(list => {
                    const record = {
                        id: nanoid(8),
                        algo,
                        startTime,
                        completeTime,
                        data: res,
                    };
                    if (list.length > 0 && list[0].algo !== algo) {
                        return [record];
                    }
                    return list.concat([record]);
                });
                setTab('result');
            }
        }).finally(() => {
            pendingRef.current = undefined;
            setRunning(false);
        });
    }, [predictInput, algo]);

    const sortedResults = useMemo(() => {
        return results.slice(0).sort((a, b) => b.completeTime - a.completeTime);
    }, [results]);

    const [comparison, setComparison] = useState<null | [string] | [string, string]>(null);

    useEffect(() => {
        setComparison(group => {
            if (!group) {
                return null;
            }
            const next = group.filter(id => results.some(rec => rec.id === id));
            if (next.length === 0) {
                return null;
            }
            return next as [string] | [string, string];
        });
    }, [results]);

    const resultTableCols = useMemo<IColumn[]>(() => {
        return [
            {
                key: 'selected',
                name: '对比',
                onRender: (item) => {
                    const record = item as typeof sortedResults[number];
                    const selected = (comparison ?? [] as string[]).includes(record.id);
                    return (
                        <Checkbox
                            checked={selected}
                            onChange={(_, checked) => {
                                if (checked) {
                                    setComparison(group => {
                                        if (group === null) {
                                            return [record.id];
                                        }
                                        return [group[0], record.id];
                                    });
                                } else if (selected) {
                                    setComparison(group => {
                                        if (group?.some(id => id === record.id)) {
                                            return group.length === 1 ? null : group.filter(id => id !== record.id) as [string];
                                        }
                                        return null;
                                    });
                                }
                            }}
                        />
                    );
                },
                isResizable: false,
                minWidth: 30,
                maxWidth: 30,
            },
            {
                key: 'index',
                name: '运行次数',
                minWidth: 70,
                maxWidth: 70,
                isResizable: false,
                onRender(_, index) {
                    return <>{index !== undefined ? (sortedResults.length - index) : ''}</>;
                },
            },
            {
                key: 'algo',
                name: '预测模型',
                minWidth: 70,
                onRender(item) {
                    const record = item as typeof sortedResults[number];
                    return <>{PredictAlgorithms.find(which => which.key === record.algo)?.text}</>
                },
            },
            {
                key: 'accuracy',
                name: '准确率',
                minWidth: 150,
                onRender(item, index) {
                    if (!item || index === undefined) {
                        return <></>;
                    }
                    const record = item as typeof sortedResults[number];
                    const previous = sortedResults[index + 1];
                    const comparison: 'better' | 'worse' | 'same' | null = previous ? (
                        previous.data.accuracy === record.data.accuracy ? 'same'
                            : record.data.accuracy > previous.data.accuracy ? 'better' : 'worse'
                    ) : null;
                    return (
                        <span
                            style={{
                                color: {
                                    better: '#0b5a08',
                                    worse: '#6e0811',
                                    same: '#7a7574',
                                }[comparison!],
                                display: 'flex',
                                alignItems: 'center',
                            }}
                        >
                            {comparison && (
                                <Icon
                                    iconName={{
                                        better: 'CaretSolidUp',
                                        worse: 'CaretSolidDown',
                                        same: 'ChromeMinimize',
                                    }[comparison]}
                                    style={{
                                        transform: 'scale(0.8)',
                                        transformOrigin: '0 50%',
                                        marginRight: '0.2em',
                                    }}
                                />
                            )}
                            {record.data.accuracy}
                        </span>
                    );
                },
            },
        ];
    }, [sortedResults, comparison]);

    const diff = useMemo(() => {
        if (comparison?.length === 2) {
            const before = sortedResults.find(res => res.id === comparison[0]);
            const after = sortedResults.find(res => res.id === comparison[1]);
            if (before && after) {
                const temp: unknown[] = [];
                for (let i = 0; i < before.data.result.length; i += 1) {
                    const row = dataSourceRef.current[before.data.result[i][0]];
                    const prev = before.data.result[i][1];
                    const next = after.data.result[i][1];
                    if (next === 1 && prev === 0) {
                        temp.push(Object.fromEntries(Object.entries(row).map(([k, v]) => [
                            allFieldsRef.current.find(f => f.fid === k)?.name ?? k,
                            v,
                        ])));
                    }
                }
                return temp;
            }
        }
    }, [sortedResults, comparison]);

    useEffect(() => {
        if (diff) {
            console.table(diff);
        }
    }, [diff]);

    return (
        <Container>
            <DefaultButton
                primary
                iconProps={{ iconName: 'Trending12' }}
                disabled={!canExecute || running}
                onClick={running ? undefined : handleClickExec}
                onRenderIcon={() => running ? <Spinner style={{ transform: 'scale(0.75)' }} /> : <Icon iconName="Play" />}
                style={{ width: 'max-content', flexGrow: 0, flexShrink: 0 }}
            >
                预测
            </DefaultButton>
            <Pivot
                selectedKey={tab}
                onLinkClick={(item) => {
                    item && setTab(item.props.itemKey as typeof tab);
                }}
            >
                <PivotItem itemKey="config" headerText="模型设置" />
                <PivotItem itemKey="result" headerText="预测结果" />
            </Pivot>
            <div className="content">
                {{
                    config: (
                        <>
                            <Dropdown
                                label="模型选择"
                                options={PredictAlgorithms.map(algo => ({ key: algo.key, text: algo.text }))}
                                selectedKey={algo}
                                onChange={(_, option) => {
                                    const item = PredictAlgorithms.find(which => which.key === option?.key);
                                    if (item) {
                                        setAlgo(item.key);
                                    }
                                }}
                                style={{ width: 'max-content' }}
                            />
                            <Label style={{ marginTop: '1em' }}>分析空间</Label>
                            <TableContainer>
                                <DetailsList
                                    items={selectedFields}
                                    columns={fieldsTableCols}
                                    selectionMode={SelectionMode.none}
                                    onRenderRow={(props, defaultRender) => {
                                        const field = props?.item as IFieldMeta;
                                        const checkedAsAttr = predictInput.features.some(f => f.fid === field.fid);
                                        const checkedAsTar = predictInput.targets.some(f => f.fid === field.fid);
                                        return (
                                            <Row selected={checkedAsAttr ? 'attribution' : checkedAsTar ? 'target' : false}>
                                                {defaultRender?.(props)}
                                            </Row>
                                        );
                                    }}
                                />
                            </TableContainer>
                        </>
                    ),
                    result: (
                        <>
                            <DefaultButton
                                iconProps={{ iconName: 'Delete' }}
                                disabled={results.length === 0}
                                onClick={() => setResults([])}
                                style={{ width: 'max-content' }}
                            >
                                清空记录
                            </DefaultButton>
                            <TableContainer>
                                <DetailsList
                                    items={sortedResults}
                                    columns={resultTableCols}
                                    selectionMode={SelectionMode.none}
                                />
                            </TableContainer>
                        </>
                    ),
                }[tab]}
            </div>
        </Container>
    );
};


export default observer(PredictPanel);
