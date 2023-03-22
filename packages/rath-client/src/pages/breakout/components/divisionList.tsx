import { DetailsList, IColumn, IconButton, Pivot, PivotItem, SelectionMode } from "@fluentui/react";
import { observer } from "mobx-react-lite";
import { memo, useCallback, useEffect, useMemo, useState } from "react";
import styled from "styled-components";
import { useBreakoutStore } from "../store";
import { formatNumber, formatRate } from "../utils/format";
import type { ISubgroupResult } from "../utils/top-drivers";
import { resolveCompareTarget } from "./controlPanel";


const FactCell = styled.div`
    display: flex;
    align-items: center;
    .action {
        width: 26px;
        display: flex;
        align-items: center;
        justify-content: center;
        overflow: hidden;
        margin-right: 0.5em;
        button {
            width: 24px;
            height: 24px;
            i {
                font-size: 10px;
            }
        }
    }
`;

const DiffCell = styled.span`
    display: inline-flex;
    flex-direction: row;
    align-items: center;
    .diff {
        font-size: 0.6rem;
        margin-left: 1em;
        padding: 0.1em 0.4em;
        background-color: #8882;
        border-radius: 0.33em;
        &.up {
            color: green;
        }
        &.down {
            color: red;
        }
    }
`;

const ImpactCell = styled.span`
    font-size: 110%;
    &.up {
        color: green;
    }
    &.down {
        color: red;
    }
`;

interface IFlatSubgroupResult extends ISubgroupResult {
    hasChildren: boolean;
    path: string[];
}

const groupSubgroupResults = (data: readonly ISubgroupResult[]): IFlatSubgroupResult[] => {
    const headers = data.filter(item => !item.path || item.path.length === 0);

    const result: IFlatSubgroupResult[] = [];
    for (const header of headers) {
        result.push();
        const children = data.filter(item => item.path?.[0] === header.id);
        if (children.length) {
            const nextLevel = groupSubgroupResults(children.map(item => {
                const path = item.path ?? [];
                const nextPath = path.slice(1);
                return {
                    ...item,
                    path: nextPath,
                };
            })).map(item => ({
                ...item,
                path: [header.id, ...item.path],
            }));
            if (nextLevel) {
                result.push({
                    ...header,
                    hasChildren: true,
                    path: [],
                }, ...nextLevel);
            } else {
                result.push({
                    ...header,
                    hasChildren: false,
                    path: [],
                });
            }
        } else {
            result.push({
                ...header,
                hasChildren: false,
                path: [],
            });
        }
    }
    return result;
};

interface IDivisionDetailListProps {
    data: ISubgroupResult[];
    title: string;
}

const DivisionDetailList = memo<IDivisionDetailListProps>(function DivisionDetailList ({
    data, title,
}) {
    const [list, setList] = useState<IFlatSubgroupResult[]>([]);
    const [openedPaths, setOpenedPaths] = useState<string[][]>([]);

    useEffect(() => {
        setList(groupSubgroupResults(data));
    }, [data]);

    useEffect(() => {
        setOpenedPaths([]);
    }, [list]);

    const displayList = useMemo(() => {
        return list.filter(item => {
            const path = item.path;
            if (!path || path.length === 0) {
                return true;
            }
            for (let i = 0; i < path.length; i += 1) {
                const partialPath = path.slice(0, i + 1);
                const match = openedPaths.some(opened => {
                    return opened.length === partialPath.length && opened.every((v, j) => v === partialPath[j]);
                });
                if (!match) {
                    return false;
                }
            }
            return true;
        });
    }, [list, openedPaths]);

    const togglePathExpanded = useCallback((path: string[]) => {
        const idx = openedPaths.findIndex(p => p.length === path.length && p.every((v, i) => v === path[i]));
        if (idx !== -1) {
            const next = openedPaths.slice();
            next.splice(idx, 1);
            setOpenedPaths(next);
        } else {
            setOpenedPaths([...openedPaths, path]);
        }
    }, [openedPaths]);

    const columns = useMemo<IColumn[]>(() => [
        {
            key: 'id',
            name: 'ID',
            minWidth: 200,
            onRender(item: IFlatSubgroupResult | undefined) {
                const path = item?.path ?? [];
                const level = path.length;
                const nextPath = item ? [...path, item.id] : [];
                const expanded = openedPaths.some(p => p.length === nextPath.length && p.every((v, i) => v === nextPath[i]));
                return (
                    <FactCell>
                        <span style={{ display: 'inline-block', width: `${level * 3}em`, textAlign: 'end' }}>
                            {level > 0 && `\u2517`}
                        </span>
                        <div className="action">
                            {item?.hasChildren && (
                                <IconButton
                                    iconProps={{ iconName: expanded ? "ChevronDownMed" : "ChevronRightMed" }}
                                    onClick={() => togglePathExpanded(nextPath)}
                                />
                            )}
                            {!item?.hasChildren && (
                                <span>{`\u2501`}</span>
                            )}
                        </div>
                        <code>
                            {item?.id}
                        </code>
                    </FactCell>
                );
            },
        },
        {
            key: 'rate',
            name: 'Rate',
            minWidth: 200,
            onRender(item: IFlatSubgroupResult | undefined) {
                return (
                    <span>
                        {formatRate(item?.rate, 2)}
                    </span>
                );
            },
        },
        {
            key: 'value',
            name: title,
            minWidth: 200,
            onRender(item: IFlatSubgroupResult | undefined) {
                const diff = item?.diff ?? 0;
                return (
                    <DiffCell>
                        <span>{formatNumber(item?.value)}</span>
                        <span className={`diff ${diff === 0 ? '' : diff > 0 ? 'up' : 'down'}`}>
                            {diff === 0 && '-'}
                            {diff > 0 && `+${formatRate(diff, 2)}`}
                            {diff < 0 && formatRate(diff, 2)}
                        </span>
                    </DiffCell>
                );
            },
        },
        {
            key: 'impact',
            name: 'Impact',
            minWidth: 200,
            onRender(item: IFlatSubgroupResult | undefined) {
                const impact = item?.impact ?? 0;
                return (
                    <ImpactCell className={impact === 0 ? '' : impact > 0 ? 'up' : 'down'}>
                        {impact === 0 && '0'}
                        {impact > 0 && `+${formatNumber(impact, 2)}`}
                        {impact < 0 && formatNumber(impact, 2)}
                    </ImpactCell>
                );
            },
        },
    ], [openedPaths, title, togglePathExpanded]);

    return (
        <DetailsList
            items={displayList}
            columns={columns}
            selectionMode={SelectionMode.none}
        />
    );
});

export interface IDivisionListProps {

}

const DivisionList = observer<IDivisionListProps>(function DivisionList () {
    const context = useBreakoutStore();
    const { generalAnalyses, comparisonAnalyses, compareTarget, compareBase, dataSourceStore } = context;
    const { fieldMetas } = dataSourceStore;
    const targetField = compareTarget ? resolveCompareTarget(compareTarget, fieldMetas) : null;

    return (
        <div>
            {compareTarget && targetField && (
                <Pivot>
                    {!compareBase && (
                        <PivotItem headerText="General Contribution">
                            <DivisionDetailList
                                data={generalAnalyses}
                                title={targetField.text}
                            />
                        </PivotItem>
                    )}
                    {Boolean(compareBase) && (
                        <PivotItem headerText="Comparison Contribution">
                            <DivisionDetailList
                                data={comparisonAnalyses}
                                title={targetField.text}
                            />
                        </PivotItem>
                    )}
                </Pivot>
            )}
        </div>
    );
});


export default DivisionList;
