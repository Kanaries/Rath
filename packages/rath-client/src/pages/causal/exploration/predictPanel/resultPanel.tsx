import intl from 'react-intl-universal';
import { Checkbox, DefaultButton, DetailsList, IColumn, Icon, SelectionMode } from "@fluentui/react";
import { observer } from "mobx-react-lite";
import { FC, useEffect, useMemo, useRef, useState } from "react";
import styled from "styled-components";
import { useGlobalStore } from "../../../../store";
import { useCausalViewContext } from "../../../../store/causalStore/viewStore";
import { PredictAlgorithms } from "../../predict";


const TableContainer = styled.div`
    flex-grow: 0;
    flex-shrink: 0;
    overflow: auto;
`;

const ResultPanel: FC = () => {
    const { dataSourceStore } = useGlobalStore();
    const { cleanedData, fieldMetas } = dataSourceStore;
    const viewContext = useCausalViewContext();
    const { predictCache = [] } = viewContext ?? {};

    const dataSourceRef = useRef(cleanedData);
    dataSourceRef.current = cleanedData;
    const allFieldsRef = useRef(fieldMetas);
    allFieldsRef.current = fieldMetas;

    const sortedResults = useMemo(() => {
        return predictCache.slice(0).sort((a, b) => b.completeTime - a.completeTime);
    }, [predictCache]);

    const [comparison, setComparison] = useState<null | [string] | [string, string]>(null);

    useEffect(() => {
        setComparison(group => {
            if (!group) {
                return null;
            }
            const next = group.filter(id => predictCache.some(rec => rec.id === id));
            if (next.length === 0) {
                return null;
            }
            return next as [string] | [string, string];
        });
    }, [predictCache]);

    const resultTableCols = useMemo<IColumn[]>(() => {
        return [
            {
                key: 'selected',
                name: intl.get('causal.analyze.diff_title'),
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
                name: intl.get('causal.analyze.run_idx'),
                minWidth: 70,
                maxWidth: 70,
                isResizable: false,
                onRender(_, index) {
                    return <>{index !== undefined ? (sortedResults.length - index) : ''}</>;
                },
            },
            {
                key: 'algo',
                name: intl.get('causal.analyze.model'),
                minWidth: 70,
                onRender(item) {
                    const record = item as typeof sortedResults[number];
                    return <>{PredictAlgorithms.find(which => which.key === record.algo)?.text}</>
                },
            },
            {
                key: 'accuracy',
                name: intl.get('causal.analyze.accuracy'),
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
            // TODO: 在界面上实现一个 diff view，代替这个 console
            // eslint-disable-next-line no-console
            console.table(diff);
        }
    }, [diff]);

    return (
        <>
            <DefaultButton
                iconProps={{ iconName: 'Delete' }}
                disabled={predictCache.length === 0}
                onClick={() => viewContext?.clearPredictResults()}
                style={{ width: 'max-content' }}
            >
                {intl.get('causal.analyze.clear_records')}
            </DefaultButton>
            <TableContainer>
                <DetailsList
                    items={sortedResults}
                    columns={resultTableCols}
                    selectionMode={SelectionMode.none}
                />
            </TableContainer>
        </>
    );
};


export default observer(ResultPanel);
