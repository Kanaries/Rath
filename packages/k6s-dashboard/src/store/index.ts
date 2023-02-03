import { createContext, createElement, CSSProperties, FC, PropsWithChildren, useCallback, useContext, useEffect, useMemo } from 'react';
import { makeAutoObservable, observable } from 'mobx';
import { IDashboardTheme, themeGold } from 'src/theme';
import type { DashboardSpecification, DashboardInfo, IRow, DashboardBlock, Static, DashboardLayoutBlock, DashboardBlockConfig } from 'src/interfaces';


export class DashboardStore {

    public readonly spec: DashboardSpecification;
    protected data: readonly IRow[];
    protected _selections: readonly DashboardBlock[];

    public constructor(dashboard: DashboardSpecification) {
        this.spec = dashboard;
        this.data = [];
        this._selections = [];
        makeAutoObservable(this, {
            spec: observable.shallow,
            // @ts-expect-error nonpublic fields
            data: observable.ref,
            _selections: observable.ref,
        });
    }

    public destroy(): void {
        // do sth
    }

    public setData(data: readonly IRow[]): void {
        this.data = data;
    }

    public getBlockById(id: string): DashboardBlock | null {
        const search = (container: DashboardLayoutBlock): DashboardBlock | null => {
            if (container.id === id) {
                return container;
            }
            for (const child of container.children) {
                if (child.id === id) {
                    return child;
                } else if (child.type === 'layout') {
                    const which = search(child);
                    if (which) {
                        return which;
                    }
                }
            }
            return null;
        };
        return search(this.spec.items);
    }

    public get selections(): Static<DashboardBlock[]> {
        return this._selections as Static<DashboardBlock[]>;
    }

    public get theme(): CSSProperties {
        const rootTheme = this.spec.config.themes[0];
        return Object.fromEntries(
            (Object.keys(themeGold) as (keyof IDashboardTheme)[]).map(k => [
                `--${k.replaceAll(/[A-Z]/g, l => `-${l.toLowerCase()}`)}`, rootTheme?.[k] || themeGold[k]
            ])
        );
    }

    public mergeTheme(baseTheme: Partial<IDashboardTheme>, theme: Partial<IDashboardTheme>): CSSProperties {
        return Object.fromEntries(
            (Object.keys(themeGold) as (keyof IDashboardTheme)[]).map(k => [
                `--${k.replaceAll(/[A-Z]/g, l => `-${l.toLowerCase()}`)}`, theme[k] || baseTheme[k] || themeGold[k]
            ])
        );
    }

    public toggleSelect(block: DashboardBlock, multiple = false): void {
        const selected = this._selections.findIndex(which => which === block);
        if (!multiple) {
            this._selections = selected ? [block] : [];
            return;
        }
        const next = this._selections.slice();
        if (selected === -1) {
            next.push(block);
        } else {
            next.splice(selected, 1);
        }
        this._selections = next;
    }

    public clearSelections(): void {
        this._selections = [];
    }

    public addBlock(parent: DashboardLayoutBlock, block: DashboardBlock): void {
        parent.children.push(block);
        if (block.type !== 'layout') {
            this._selections = [block];
        }
        this.spec.items = { ...this.spec.items };
    }

    public removeBlock(id: string): void {
        const walk = (container: DashboardLayoutBlock): void => {
            const next: DashboardBlock[] = [];
            for (const child of container.children) {
                if (child.id === id) {
                    continue;
                } else {
                    next.push(child);
                    if (child.type === 'layout') {
                        walk(child);
                    }
                }
            }
            container.children = next;
        };
        walk(this.spec.items);
        this.spec.items = { ...this.spec.items };
    }

    public moveBlocks(sources: DashboardBlock[], to: DashboardLayoutBlock, idx: number): void {
        for (const source of sources) {
            this.removeBlock(source.id);
        }
        to.children.splice(idx, 0, ...sources);
        this.spec.items = { ...this.spec.items };
    }

}

// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
const DashboardContext = createContext<DashboardStore>(null!);

export const useDashboardContextProvider = (dashboard: DashboardSpecification): FC<PropsWithChildren<unknown>> => {
    const definedContext = useDashboardContext();
    const context = useMemo(() => definedContext || new DashboardStore(dashboard), [definedContext, dashboard]);

    useEffect(() => {
        if (!definedContext) {
            const ref = context;
            return () => {
                ref.destroy();
            };
        }
        return;
    }, [context, definedContext]);

    return useCallback(function DashboardContextProvider ({ children }) {
        return createElement(DashboardContext.Provider, { value: context }, children);
    }, [context]);
};

export const useDashboardContext = () => useContext(DashboardContext);

export const useDashboardInfo = (): DashboardInfo => {
    const { spec: data } = useContext(DashboardContext);
    return {
        title: data.title,
    };
};

export const useDashboardBlockTheme = (config: Partial<DashboardBlockConfig> | undefined): Partial<CSSProperties> => {
    const dashboard = useContext(DashboardContext);
    const rootTheme = dashboard.spec.config.themes[0] ?? {};
    const blockTheme = dashboard.spec.config.themes[config?.themeId ?? 0];

    return useMemo(() => {
        if (blockTheme && blockTheme !== rootTheme) {
            return dashboard.mergeTheme(rootTheme, blockTheme);
        }
        return dashboard.theme;
    }, [dashboard, rootTheme, blockTheme]);
};
