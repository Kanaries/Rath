import { type ReactEventHandler, type ChangeEvent, useMemo, useRef } from "react";


export interface UsePaginationParams {
    /**
     * Number of always visible pages at the beginning and end.
     * @default 1
     */
    boundaryCount?: number;
    /**
     * The total number of pages.
     * @default 1
     */
    count?: number;
    /**
     * If `true`, the component is disabled.
     * @default false
     */
    disabled?: boolean;
    /**
     * If `true`, hide the next-page button.
     * @default false
     */
    hideNextButton?: boolean;
    /**
     * If `true`, hide the previous-page button.
     * @default false
     */
    hidePrevButton?: boolean;
    /**
     * Callback fired when the page is changed.
     *
     * @param {ChangeEvent<unknown>} event The event source of the callback.
     * @param {number} page The page selected.
     */
    onChange?: (event: ChangeEvent<unknown>, page: number) => void;
    /**
     * The current page, starting from 1.
     */
    page?: number;
    /**
     * Number of always visible pages before and after the current page.
     * @default 1
     */
    siblingCount?: number;
}

export interface UsePaginationItem {
    onClick: ReactEventHandler;
    type: 'page' | 'next' | 'previous' | 'start-ellipsis' | 'end-ellipsis';
    page: number;
    selected: boolean;
    disabled: boolean;
}

export interface UsePaginationResult {
    items: readonly UsePaginationItem[];
    isFallback: boolean;
}

export const usePagination = (params: UsePaginationParams): UsePaginationResult => {
    const {
        boundaryCount = 1,
        count = 1,
        disabled = false,
        hideNextButton = false,
        hidePrevButton = false,
        onChange,
        page = 1,
        siblingCount = 1,
    } = params;

    const isPageIdxValid = Number.isFinite(page) && Math.floor(page!) === page && page >= 1 && page <= count;
    const prevPageEnabled = isPageIdxValid && page > 1;
    const nextPageEnabled = isPageIdxValid && page + 1 <= count;

    const onChangeRef = useRef(onChange);
    onChangeRef.current = onChange;

    const items = useMemo<UsePaginationItem[]>(() => {
        const MAX_CENTER_ITEMS = 1 + siblingCount * 2;
        if (!isPageIdxValid) {
            const items: UsePaginationItem[] = [];
            for (let i = 1; i <= Math.min(count, boundaryCount * 2 + MAX_CENTER_ITEMS); i += 1) {
                items.push({
                    type: 'page',
                    page: i,
                    selected: false,
                    disabled,
                    onClick: event => {
                        if (disabled) {
                            return;
                        }
                        onChangeRef.current?.(event, i);
                    },
                });
            }
            return items;
        }
        const leftPartMax = boundaryCount;
        const rightPartMin = Math.max(0, count + 1 - boundaryCount);
        const centerPartMin = Math.max(leftPartMax + 1, page - MAX_CENTER_ITEMS);
        const centerPartMax = Math.min(page + MAX_CENTER_ITEMS, rightPartMin - 1);
        let centerItems: number[] = [];
        for (let i = centerPartMin; i <= centerPartMax; i += 1) {
            centerItems.push(i);
        }
        centerItems = centerItems.sort((a, b) => Math.abs(a - page) - Math.abs(b - page)).slice(0, MAX_CENTER_ITEMS).sort((a, b) => a - b);
        const items: UsePaginationItem[] = [];
        for (let i = 1; i <= leftPartMax; i += 1) {
            items.push({
                type: 'page',
                page: i,
                selected: i === page,
                disabled,
                onClick: event => {
                    if (disabled || i === page) {
                        return;
                    }
                    onChangeRef.current?.(event, i);
                },
            });
        }
        if ((centerItems.at(0) ?? -1) > leftPartMax + 1) {
            items.push({
                type: 'start-ellipsis',
                page: -1,
                selected: false,
                disabled,
                onClick: () => {},
            });
        }
        for (const idx of centerItems) {
            items.push({
                type: 'page',
                page: idx,
                selected: idx === page,
                disabled,
                onClick: event => {
                    if (disabled || idx === page) {
                        return;
                    }
                    onChangeRef.current?.(event, idx);
                },
            });
        }
        if ((centerItems.at(-1) ?? Infinity) < rightPartMin - 1) {
            items.push({
                type: 'end-ellipsis',
                page: -1,
                selected: false,
                disabled,
                onClick: () => {},
            });
        }
        for (let i = rightPartMin; i <= count; i += 1) {
            if (items.some(item => item.page === i)) {
                continue;
            }
            items.push({
                type: 'page',
                page: i,
                selected: i === page,
                disabled,
                onClick: event => {
                    if (disabled || i === page) {
                        return;
                    }
                    onChangeRef.current?.(event, i);
                },
            });
        }

        if (!hidePrevButton) {
            items.unshift({
                type: 'previous',
                page: page - 1,
                selected: false,
                disabled: disabled || !prevPageEnabled,
                onClick: event => {
                    if (disabled || !prevPageEnabled) {
                        return;
                    }
                    onChangeRef.current?.(event, page - 1);
                },
            });
        }
        if (!hideNextButton) {
            items.push({
                type: 'next',
                page: page + 1,
                selected: false,
                disabled: disabled || !nextPageEnabled,
                onClick: event => {
                    if (disabled || !nextPageEnabled) {
                        return;
                    }
                    onChangeRef.current?.(event, page + 1);
                },
            });
        }

        return items;
    }, [siblingCount, isPageIdxValid, count, page, disabled, hidePrevButton, hideNextButton, boundaryCount, prevPageEnabled, nextPageEnabled]);

    return useMemo<UsePaginationResult>(() => {
        return {
            items,
            isFallback: !isPageIdxValid,
        };
    }, [items, isPageIdxValid]);
};
