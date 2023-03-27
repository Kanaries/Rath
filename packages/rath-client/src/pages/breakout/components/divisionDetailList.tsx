import { DetailsList, IColumn, IconButton, IDetailsRowProps, IRenderFunction, SelectionMode } from "@fluentui/react";
import intl from 'react-intl-universal';
import styled from "styled-components";
import { memo, useCallback, useEffect, useMemo, useState } from "react";
import { useBreakoutStore } from "../store";
import { formatNumber, formatRate } from "../utils/format";
import type { ISubgroupResult } from "../utils/top-drivers";
import { arrayEquals } from "../utils";
import { groupSubgroupResults } from "./divisionList";


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
    .detail {
        font-size: 0.5rem;
        margin-left: 1em;
        ::before {
            content: "(";
        }
        ::after {
            content: ")";
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

export interface IFlatSubgroupResult extends ISubgroupResult {
    hasChildren: boolean;
    path: string[];
}

interface IDivisionDetailListProps {
    data: ISubgroupResult[];
    title: string;
    /** @default false */
    action?: 'setMainFilter' | 'setComparisonFilter' | false;
}

const DivisionDetailList = memo<IDivisionDetailListProps>(function DivisionDetailList ({
    data, title, action = false,
}) {
    const list = useMemo(() => groupSubgroupResults(data), [data]);
    const [openedPaths, setOpenedPaths] = useState<string[][]>([]);
    const context = useBreakoutStore();

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
                const match = openedPaths.some(opened => arrayEquals(opened, partialPath));
                if (!match) {
                    return false;
                }
            }
            return true;
        });
    }, [list, openedPaths]);

    const togglePathExpanded = useCallback((path: string[]) => {
        const idx = openedPaths.findIndex(p => arrayEquals(p, path));
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
            name: intl.get('breakout.id'),
            minWidth: 200,
            onRender(item: IFlatSubgroupResult | undefined) {
                const path = item?.path ?? [];
                const level = path.length;
                const nextPath = item ? [...path, item.id] : [];
                const expanded = openedPaths.some(p => p.length === nextPath.length && p.every((v, i) => v === nextPath[i]));
                return (
                    <FactCell>
                        <span style={{ display: 'inline-block', width: `${level * 3}em`, textAlign: 'end' }}>
                            {/* ┗ - a block character looks like "|-" */}
                            {level > 0 && `\u2517`}
                        </span>
                        <div className="action">
                            {item?.hasChildren && (
                                <IconButton
                                    iconProps={{ iconName: expanded ? "ChevronDownMed" : "ChevronRightMed" }}
                                    onClick={e => {
                                        e.stopPropagation();
                                        togglePathExpanded(nextPath);
                                        context.focusSubgroup(item.field.fid);
                                    }}
                                />
                            )}
                            {!item?.hasChildren && (
                                // ━ - a block character looks like "-"
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
            name: intl.get('breakout.rate'),
            minWidth: 200,
            onRender(item: IFlatSubgroupResult | undefined) {
                const prev = item?.rateBefore;
                const next = item?.rate;
                const diff = prev !== undefined && next !== undefined ? (
                    next - prev
                ) : null;
                return (
                    <DiffCell>
                        <span>
                            {formatRate(next, 2)}
                        </span>
                        {Boolean(diff) && (
                            <span className="detail">
                                {diff! > 0 && `+${formatRate(diff, 2)}`}
                                {diff! < 0 && formatRate(diff, 2)}
                            </span>
                        )}
                    </DiffCell>
                );
            },
        },
        {
            key: 'value',
            name: title,
            minWidth: 200,
            onRender(item: IFlatSubgroupResult | undefined) {
                const value = formatNumber(item?.value);
                const diff = item?.diff;
                return (
                    <DiffCell>
                        <span>{formatNumber(value)}</span>
                        {Number.isFinite(diff) && value !== '-' && (
                            <span className={`diff ${diff === 0 ? '' : diff! > 0 ? 'up' : 'down'}`}>
                                {diff! === 0 && '-'}
                                {diff! > 0 && `+${formatRate(diff, 2)}`}
                                {diff! < 0 && formatRate(diff, 2)}
                            </span>
                        )}
                    </DiffCell>
                );
            },
        },
        {
            key: 'impact',
            name: intl.get('breakout.impact'),
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
    ], [openedPaths, title, togglePathExpanded, context]);

    const onRenderRow = useCallback<IRenderFunction<IDetailsRowProps>>((props, defaultRenderer) => {
        const item = props?.item as IFlatSubgroupResult | undefined;

        const handleClick = () => {
            if (!item) {
                return;
            }
            if (action === 'setMainFilter') {
                context.setMainFieldFilters([item.filter]);
            } else if (action === 'setComparisonFilter') {
                context.setComparisonFilters([item.filter]);
            }
        };

        return (
            <div onClick={handleClick} style={{ cursor: action ? 'pointer' : 'default' }}>
                {defaultRenderer?.(props)}
            </div>
        );
    }, [context, action]);

    return (
        <DetailsList
            items={displayList}
            columns={columns}
            selectionMode={SelectionMode.none}
            onRenderRow={onRenderRow}
        />
    );
});


export default DivisionDetailList;
