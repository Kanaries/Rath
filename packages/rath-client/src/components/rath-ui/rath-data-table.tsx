import * as React from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { ArrowDown, ArrowUp } from 'lucide-react';
import { Checkbox } from '../ui/checkbox';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { cn } from '../../utils/cn';

export interface RathColumn<T> {
    key: string;
    name?: React.ReactNode;
    fieldName?: keyof T | string;
    onRender?: (item: T, index?: number, column?: RathColumn<T>) => React.ReactNode;
    onRenderHeader?: (column?: RathColumn<T>) => React.ReactNode;
    minWidth?: number;
    maxWidth?: number;
    width?: string;
    isSorted?: boolean;
    isSortedDescending?: boolean;
    isSortable?: boolean;
    isResizable?: boolean;
    className?: string;
    headerClassName?: string;
    isMultiline?: boolean;
}

export interface RathDataTableSelection<T> {
    mode: 'single' | 'multiple';
    selectedKeys: string[];
    onChange: (keys: string[]) => void;
    getKey: (item: T, index: number) => string;
}

interface RathDataTableProps<T> {
    items: T[];
    columns: RathColumn<T>[];
    getRowKey?: (item: T, index: number) => React.Key;
    selection?: RathDataTableSelection<T>;
    rowClassName?: (item: T, index: number) => string | undefined;
    rowStyle?: (item: T, index: number) => React.CSSProperties | undefined;
    onRowClick?: (item: T, index: number) => void;
    onRowMouseEnter?: (item: T, index: number, event: React.MouseEvent<HTMLTableRowElement>) => void;
    onRowMouseLeave?: (item: T, index: number, event: React.MouseEvent<HTMLTableRowElement>) => void;
    onColumnHeaderClick?: (column: RathColumn<T>) => void;
    emptyMessage?: React.ReactNode;
    compact?: boolean;
    isHeaderVisible?: boolean;
    className?: string;
    tableClassName?: string;
    virtualized?: boolean;
    horizontalVirtualized?: boolean;
    virtualizationThreshold?: number;
    estimatedRowHeight?: number;
    maxHeight?: React.CSSProperties['maxHeight'];
    onScroll?: React.UIEventHandler<HTMLDivElement>;
}

const getCellValue = <T,>(item: T, column: RathColumn<T>) => {
    const key = column.fieldName ?? column.key;
    return (item as Record<string, React.ReactNode>)[String(key)];
};

const CELL_INLINE_PADDING = 16;

const withCellPadding = (width: number | undefined): number | undefined =>
    width === undefined ? undefined : width + CELL_INLINE_PADDING;

const getColumnStyle = <T,>(column: RathColumn<T>, resizedWidth?: number): React.CSSProperties => {
    if (resizedWidth !== undefined) {
        return {
            minWidth: resizedWidth,
            maxWidth: resizedWidth,
            width: resizedWidth,
        };
    }
    return {
        minWidth: withCellPadding(column.minWidth),
        maxWidth: withCellPadding(column.maxWidth),
        width: column.maxWidth && column.minWidth === column.maxWidth ? withCellPadding(column.maxWidth) : undefined,
    };
};

const getColumnSize = <T,>(column: RathColumn<T>, resizedWidth?: number): number | undefined => {
    if (resizedWidth !== undefined) {
        return resizedWidth;
    }
    return withCellPadding(column.maxWidth ?? column.minWidth);
};

export function RathDataTable<T>({
    items,
    columns,
    getRowKey,
    selection,
    rowClassName,
    rowStyle,
    onRowClick,
    onRowMouseEnter,
    onRowMouseLeave,
    onColumnHeaderClick,
    emptyMessage = 'No data',
    compact = false,
    isHeaderVisible = true,
    className,
    tableClassName,
    virtualized = true,
    horizontalVirtualized = false,
    virtualizationThreshold = 100,
    estimatedRowHeight = compact ? 29 : 37,
    maxHeight,
    onScroll,
}: RathDataTableProps<T>) {
    const scrollContainerRef = React.useRef<HTMLDivElement>(null);
    const selectedKeySet = React.useMemo(() => new Set(selection?.selectedKeys ?? []), [selection?.selectedKeys]);
    const [columnWidths, setColumnWidths] = React.useState<Record<string, number>>({});
    const resizeCleanupRef = React.useRef<(() => void) | null>(null);
    const allSelected = selection && items.length > 0 && items.every((item, index) => selectedKeySet.has(selection.getKey(item, index)));
    const partiallySelected = selection && !allSelected && items.some((item, index) => selectedKeySet.has(selection.getKey(item, index)));
    const shouldVirtualize = virtualized && maxHeight !== undefined && items.length > virtualizationThreshold;
    const rowVirtualizer = useVirtualizer({
        count: shouldVirtualize ? items.length : 0,
        getScrollElement: () => scrollContainerRef.current,
        estimateSize: () => estimatedRowHeight,
        overscan: 8,
    });
    const virtualItems = shouldVirtualize ? rowVirtualizer.getVirtualItems() : [];
    const visibleIndices = shouldVirtualize && virtualItems.length > 0 ? virtualItems.map((row) => row.index) : items.map((_, index) => index);
    const paddingTop = shouldVirtualize && virtualItems.length > 0 ? virtualItems[0].start : 0;
    const paddingBottom =
        shouldVirtualize && virtualItems.length > 0 ? rowVirtualizer.getTotalSize() - virtualItems[virtualItems.length - 1].end : 0;
    const canVirtualizeColumns = columns.length > 0 && columns.every((column) => getColumnSize(column, columnWidths[column.key]) !== undefined);
    const shouldVirtualizeColumns = horizontalVirtualized && !selection && canVirtualizeColumns;
    const columnVirtualizer = useVirtualizer({
        horizontal: true,
        count: shouldVirtualizeColumns ? columns.length : 0,
        getScrollElement: () => scrollContainerRef.current,
        estimateSize: (index) => getColumnSize(columns[index], columnWidths[columns[index].key]) ?? 0,
        getItemKey: (index) => columns[index].key,
        overscan: 2,
    });
    const virtualColumns = shouldVirtualizeColumns ? columnVirtualizer.getVirtualItems() : [];
    const visibleColumns =
        shouldVirtualizeColumns && virtualColumns.length > 0
            ? virtualColumns.map((virtualColumn) => columns[virtualColumn.index])
            : columns;
    const paddingLeft = shouldVirtualizeColumns && virtualColumns.length > 0 ? virtualColumns[0].start : 0;
    const paddingRight =
        shouldVirtualizeColumns && virtualColumns.length > 0
            ? columnVirtualizer.getTotalSize() - virtualColumns[virtualColumns.length - 1].end
            : 0;
    const renderedColumnCount = visibleColumns.length + (selection ? 1 : 0) + (paddingLeft > 0 ? 1 : 0) + (paddingRight > 0 ? 1 : 0);
    const minimumTableWidth = React.useMemo(
        () =>
            columns.reduce((total, column) => total + (withCellPadding(column.minWidth) ?? 0), selection ? 32 : 0),
        [columns, selection]
    );

    const setRowSelected = React.useCallback(
        (item: T, index: number, checked: boolean) => {
            if (!selection) {
                return;
            }
            const key = selection.getKey(item, index);
            if (selection.mode === 'single') {
                selection.onChange(checked ? [key] : []);
                return;
            }
            const next = new Set(selection.selectedKeys);
            if (checked) {
                next.add(key);
            } else {
                next.delete(key);
            }
            selection.onChange(Array.from(next));
        },
        [selection]
    );

    const setAllSelected = React.useCallback(
        (checked: boolean) => {
            if (!selection || selection.mode !== 'multiple') {
                return;
            }
            selection.onChange(checked ? items.map((item, index) => selection.getKey(item, index)) : []);
        },
        [items, selection]
    );

    React.useEffect(() => () => resizeCleanupRef.current?.(), []);

    const updateColumnWidth = React.useCallback((column: RathColumn<T>, width: number) => {
        const minWidth = withCellPadding(column.minWidth ?? 40) ?? 40;
        const maxWidth = column.maxWidth === undefined ? Number.POSITIVE_INFINITY : withCellPadding(column.maxWidth) ?? column.maxWidth;
        setColumnWidths((current) => ({
            ...current,
            [column.key]: Math.min(Math.max(width, minWidth), maxWidth),
        }));
    }, []);

    const startColumnResize = React.useCallback(
        (event: React.MouseEvent<HTMLButtonElement>, column: RathColumn<T>) => {
            event.preventDefault();
            event.stopPropagation();
            resizeCleanupRef.current?.();
            const startX = event.clientX;
            const startWidth = columnWidths[column.key] ?? event.currentTarget.parentElement?.getBoundingClientRect().width ?? column.minWidth ?? 80;
            const handleMouseMove = (moveEvent: MouseEvent) => updateColumnWidth(column, startWidth + moveEvent.clientX - startX);
            const cleanup = () => {
                document.removeEventListener('mousemove', handleMouseMove);
                document.removeEventListener('mouseup', cleanup);
                resizeCleanupRef.current = null;
            };
            resizeCleanupRef.current = cleanup;
            document.addEventListener('mousemove', handleMouseMove);
            document.addEventListener('mouseup', cleanup);
        },
        [columnWidths, updateColumnWidth]
    );

    return (
        <div className={cn('min-w-0 w-full', className)}>
            <Table
                containerRef={scrollContainerRef}
                containerClassName={cn(shouldVirtualize && 'h-full', maxHeight !== undefined && 'overscroll-contain')}
                containerStyle={{ maxHeight }}
                onContainerScroll={onScroll}
                className={cn('min-w-full table-fixed', tableClassName)}
                style={{ minWidth: minimumTableWidth || undefined }}
                data-virtualized={shouldVirtualize || undefined}
                data-horizontal-virtualized={shouldVirtualizeColumns || undefined}
            >
                {isHeaderVisible && (
                    <TableHeader className={cn(shouldVirtualize && 'sticky top-0 z-10 bg-background')}>
                        <TableRow>
                            {selection && (
                                <TableHead className="w-8 px-2">
                                    {selection.mode === 'multiple' && (
                                        <Checkbox
                                            checked={partiallySelected ? 'indeterminate' : Boolean(allSelected)}
                                            onCheckedChange={(checked) => setAllSelected(checked === true)}
                                            aria-label="Select all"
                                        />
                                    )}
                                </TableHead>
                            )}
                            {paddingLeft > 0 && <TableHead aria-hidden className="p-0" style={{ width: paddingLeft, minWidth: paddingLeft }} />}
                            {visibleColumns.map((column) => {
                                const sortable = Boolean(onColumnHeaderClick && column.isSortable);
                                const headerContent = (
                                    <span className="flex min-w-0 max-w-full items-center gap-1 overflow-hidden whitespace-nowrap">
                                        {column.onRenderHeader ? (
                                            <span className="block min-w-0 flex-1 overflow-hidden">{column.onRenderHeader(column)}</span>
                                        ) : (
                                            <span className="min-w-0 truncate">{column.name}</span>
                                        )}
                                        {column.isSorted &&
                                            (column.isSortedDescending ? (
                                                <ArrowDown className="h-3.5 w-3.5 shrink-0" aria-hidden />
                                            ) : (
                                                <ArrowUp className="h-3.5 w-3.5 shrink-0" aria-hidden />
                                            ))}
                                    </span>
                                );
                                return (
                                    <TableHead
                                        key={column.key}
                                        style={getColumnStyle(column, columnWidths[column.key])}
                                        title={column.onRenderHeader || typeof column.name !== 'string' ? undefined : column.name}
                                        aria-sort={column.isSorted ? (column.isSortedDescending ? 'descending' : 'ascending') : undefined}
                                        className={cn(
                                            'relative overflow-hidden text-ellipsis whitespace-nowrap',
                                            compact && 'h-7 py-1',
                                            column.width,
                                            column.headerClassName
                                        )}
                                    >
                                        {sortable ? (
                                            <button
                                                type="button"
                                                className="flex h-full w-full items-center text-left hover:text-foreground focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-ring"
                                                onClick={() => onColumnHeaderClick?.(column)}
                                            >
                                                {headerContent}
                                            </button>
                                        ) : (
                                            headerContent
                                        )}
                                        {column.isResizable && (
                                            <button
                                                type="button"
                                                aria-label={`Resize ${String(column.name ?? column.key)} column`}
                                                className="absolute inset-y-1 right-0 w-2 cursor-col-resize touch-none border-r border-transparent hover:border-ring focus-visible:border-ring focus-visible:outline-hidden"
                                                onMouseDown={(event) => startColumnResize(event, column)}
                                                onKeyDown={(event) => {
                                                    if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
                                                        event.preventDefault();
                                                        const direction = event.key === 'ArrowLeft' ? -1 : 1;
                                                        updateColumnWidth(
                                                            column,
                                                            (columnWidths[column.key] ?? column.minWidth ?? 80) + direction * 10
                                                        );
                                                    }
                                                }}
                                            />
                                        )}
                                    </TableHead>
                                );
                            })}
                            {paddingRight > 0 && <TableHead aria-hidden className="p-0" style={{ width: paddingRight, minWidth: paddingRight }} />}
                        </TableRow>
                    </TableHeader>
                )}
                <TableBody>
                    {items.length === 0 ? (
                        <TableRow>
                            <TableCell
                                colSpan={renderedColumnCount}
                                className={cn('text-center text-muted-foreground', compact ? 'p-2' : 'p-4')}
                            >
                                {emptyMessage}
                            </TableCell>
                        </TableRow>
                    ) : (
                        <>
                            {paddingTop > 0 && (
                                <TableRow aria-hidden className="border-0 hover:bg-transparent">
                                    <TableCell className="p-0" colSpan={renderedColumnCount} style={{ height: paddingTop }} />
                                </TableRow>
                            )}
                            {visibleIndices.map((index) => {
                                const item = items[index];
                                const key = selection?.getKey(item, index) ?? getRowKey?.(item, index) ?? index;
                                const selected = selection ? selectedKeySet.has(selection.getKey(item, index)) : false;
                                const rowInteractive = Boolean(onRowClick || selection);
                                const handleRowAction = () => {
                                    if (onRowClick) {
                                        onRowClick(item, index);
                                    } else if (selection) {
                                        setRowSelected(item, index, !selected);
                                    }
                                };
                                return (
                                    <TableRow
                                        key={key}
                                        data-state={selected ? 'selected' : undefined}
                                        className={cn(rowInteractive && 'cursor-pointer', rowClassName?.(item, index))}
                                        style={rowStyle?.(item, index)}
                                        tabIndex={rowInteractive ? 0 : undefined}
                                        onClick={rowInteractive ? handleRowAction : undefined}
                                        onKeyDown={
                                            rowInteractive
                                                ? (event) => {
                                                      if (event.key === 'Enter' || event.key === ' ') {
                                                          event.preventDefault();
                                                          handleRowAction();
                                                      }
                                                  }
                                                : undefined
                                        }
                                        onMouseEnter={(event) => onRowMouseEnter?.(item, index, event)}
                                        onMouseLeave={(event) => onRowMouseLeave?.(item, index, event)}
                                    >
                                        {selection && (
                                            <TableCell className={cn('w-8 px-2', compact && 'py-1')}>
                                                <Checkbox
                                                    checked={selected}
                                                    onCheckedChange={(checked) => setRowSelected(item, index, checked === true)}
                                                    onClick={(event) => event.stopPropagation()}
                                                    aria-label="Select row"
                                                />
                                            </TableCell>
                                        )}
                                        {paddingLeft > 0 && (
                                            <TableCell aria-hidden className="p-0" style={{ width: paddingLeft, minWidth: paddingLeft }} />
                                        )}
                                        {visibleColumns.map((column) => (
                                            <TableCell
                                                key={column.key}
                                                style={getColumnStyle(column, columnWidths[column.key])}
                                                className={cn(
                                                    'overflow-hidden',
                                                    column.isMultiline ? 'whitespace-normal' : 'truncate whitespace-nowrap',
                                                    compact && 'py-1',
                                                    column.width,
                                                    column.className
                                                )}
                                                title={
                                                    column.onRender || column.isMultiline
                                                        ? undefined
                                                        : String(getCellValue(item, column) ?? '') || undefined
                                                }
                                            >
                                                {column.onRender ? column.onRender(item, index, column) : getCellValue(item, column)}
                                            </TableCell>
                                        ))}
                                        {paddingRight > 0 && (
                                            <TableCell aria-hidden className="p-0" style={{ width: paddingRight, minWidth: paddingRight }} />
                                        )}
                                    </TableRow>
                                );
                            })}
                            {paddingBottom > 0 && (
                                <TableRow aria-hidden className="border-0 hover:bg-transparent">
                                    <TableCell className="p-0" colSpan={renderedColumnCount} style={{ height: paddingBottom }} />
                                </TableRow>
                            )}
                        </>
                    )}
                </TableBody>
            </Table>
        </div>
    );
}
