import { createContext, createElement, FC, PropsWithChildren, useCallback, useContext, useEffect, useMemo } from 'react';
import { makeAutoObservable, observable } from 'mobx';
import { ChatBubbleBottomCenterTextIcon, PresentationChartLineIcon, StopIcon, TableCellsIcon, VariableIcon, ViewColumnsIcon } from '@heroicons/react/24/outline';
import LayoutBlock from '@components/dashboard-page/block/layout-block';
import BlankBlock from '@components/dashboard-page/block/blank-block';
import TextBlock from '@components/dashboard-page/block/text-block';
import DataBlock from '@components/dashboard-page/block/data-block';
import type { WorkspaceBlockConfig, DashboardBlocks, DashboardBlockMap, DashboardBlockType } from 'src/interfaces';


const subscribeBlock = <Type extends DashboardBlockType, T extends DashboardBlockMap[Type] = DashboardBlockMap[Type]>(
    type: T['type'],
    component: WorkspaceBlockConfig<Type>['onRender'],
    config: Omit<WorkspaceBlockConfig<Type>, 'type' | 'name' | 'onRender'>,
): WorkspaceBlockConfig<Type> => {
    return {
        ...config,
        type,
        name: type,
        onRender: component,
    };
};

export class WorkspaceStore {

    protected blockConfig: {
        readonly [key in keyof DashboardBlocks]?: WorkspaceBlockConfig<key> | undefined;
    };

    public get block() {
        return this.blockConfig;
    }

    public constructor() {
        this.blockConfig = {
            layout: subscribeBlock('layout', LayoutBlock, {
                getIcon: ({ direction }) => (
                    <ViewColumnsIcon style={{ transform: direction === 'horizontal' ? '' : 'rotate(90deg)' }} />
                ),
                getTileDisplayName: data => (
                    <>{`${data.direction} layout`}</>
                ),
                onInspect: () => <></>,
            }),
            blank: subscribeBlock('blank', BlankBlock, {
                getIcon: () => <StopIcon />,
                onInspect: () => <></>,
            }),
            text: subscribeBlock('text', TextBlock, {
                getIcon: () => <ChatBubbleBottomCenterTextIcon />,
                onInspect: () => <></>,
            }),
            data: subscribeBlock('data', DataBlock, {
                getIcon: ({ mode }) => ({
                    result: <VariableIcon />,
                    table: <TableCellsIcon />,
                    vega: <PresentationChartLineIcon />,
                }[mode]),
                getTileDisplayName: ({ mode }) => <>{mode}</>,
                onInspect: () => <></>,
            }),
        };
        makeAutoObservable(this, {
            // @ts-expect-error nonpublic fields
            blockConfig: observable.ref,
        });
    }

    public destroy(): void {
        // do sth
    }

}

// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
const WorkspaceContext = createContext<WorkspaceStore>(null!);

export const useWorkspaceContextProvider = (): FC<PropsWithChildren<unknown>> => {
    const definedContext = useWorkspaceContext();
    const context = useMemo(() => definedContext || new WorkspaceStore(), [definedContext]);

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
        return createElement(WorkspaceContext.Provider, { value: context }, children);
    }, [context]);
};

export const useWorkspaceContext = () => useContext(WorkspaceContext);

export const useBlockConfigs = (): WorkspaceStore['block'] => {
    const ctx = useWorkspaceContext();
    return ctx.block;
};
