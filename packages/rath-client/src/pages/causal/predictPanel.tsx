import { Checkbox, DefaultButton, DetailsList, Dropdown, IColumn, Icon, Label, Pivot, PivotItem, SelectionMode, Spinner } from "@fluentui/react";
import produce from "immer";
import { observer } from "mobx-react-lite";
import { FC, useCallback, useEffect, useMemo, useRef, useState } from "react";
import styled from "styled-components";
import { IFieldMeta } from "../../interfaces";
import { useGlobalStore } from "../../store";
import { execPredict, IPredictResult, PredictAlgorithm, PredictAlgorithms } from "./predict";


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
        > * {
            flex-grow: 0;
            flex-shrink: 0;
        }
    }
`;

const TableContainer = styled.div`
    flex-grow: 1;
    flex-shrink: 1;
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
        algo: PredictAlgorithm; startTime: number; completeTime: number; data: IPredictResult;
    }[]>([]);

    useEffect(() => {
        setResults([]);
    }, [cleanedData, fieldMetas]);

    const [tab, setTab] = useState<'config' | 'result'>('config');

    const handleClickExec = useCallback(() => {
        const startTime = Date.now();
        setRunning(true);
        const task = execPredict({
            dataSource: dataSourceRef.current,
            model: {
                algorithm: algo,
                features: predictInput.features.map(f => f.fid),
                target: predictInput.targets.map(f => f.fid),
            },
            fields: allFieldsRef.current,
        });
        pendingRef.current = task;
        task.then(res => {
            if (task === pendingRef.current && res) {
                const completeTime = Date.now();
                setResults(list => {
                    const record = {
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

    const resultTableCols = useMemo<IColumn[]>(() => {
        return [
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
            {
                key: 'raw',
                name: 'raw',
                minWidth: 200,
                onRender(item) {
                    const record = item as typeof sortedResults[number];
                    const info = record.data.result.map(([index, value]) => `${index} -> ${value};`).join('\n');
                    return (
                        <span title={info}>{info}</span>
                    );
                },
            },
        ];
    }, [sortedResults]);

    return (
        <Container>
            <DefaultButton
                primary
                iconProps={{ iconName: 'Trending12' }}
                disabled={!canExecute || running}
                onClick={running ? undefined : handleClickExec}
                onRenderIcon={() => running ? <Spinner style={{ transform: 'scale(0.75)' }} /> : <Icon iconName="Play" />}
                style={{ width: 'max-content' }}
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
                            <TableContainer style={{ flexGrow: 1, flexShrink: 1 }}>
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
