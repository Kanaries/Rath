import styled from 'styled-components';
import { runInAction } from 'mobx';
import { observer } from 'mobx-react-lite';
import { useDashboardBlockTheme, useDashboardContext } from '@store/index';
import { useCallback, useEffect, useRef, MouseEventHandler, PropsWithChildren } from 'react';
import type { DashboardBlock } from 'src/interfaces';


const Root = styled.div<{ isSelected: boolean; transparent: boolean }>`
    flex-grow: var(--grow);
    flex-shrink: var(--grow);
    flex-basis: 0%;
    background-color: ${({ transparent }) => transparent ? 'transparent' : 'var(--card-background)'};
    outline: none;
    border: 2px dashed;
    border-color: ${({ isSelected }) => isSelected ? 'var(--outline)' : 'transparent'};
    overflow: hidden;
    > * {
        width: 100%;
        height: 100%;
    }
`;

const BlockRoot = observer<PropsWithChildren<{ data: DashboardBlock }>>(function BlockRoot ({ data, children }) {
    const dashboard = useDashboardContext();
    const { selections } = dashboard;
    const rootTheme = useDashboardBlockTheme(data.config);
    const grow = data.config?.grow ?? 1;

    const isRoot = dashboard.spec.items === data;
    const isSelected = selections.some(b => b === data);

    const handleSelect = useCallback<MouseEventHandler<HTMLDivElement>>(ev => {
        ev.stopPropagation();
        if (isRoot) {
            dashboard.clearSelections();
        } else {
            dashboard.toggleSelect(data, ev.metaKey);
        }
    }, [data, selections, isRoot]);

    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const d = data as { __ref__?: HTMLDivElement | null };
        runInAction(() => {
            d.__ref__ = ref.current;
        });
        return () => {
            runInAction(() => {
                delete d['__ref__'];
            });
        };
    }, [data]);

    const {
        transparent = data.type === 'layout' || data.type === 'blank'
    } = data.config ?? {};

    return (
        <Root
            style={{
                ...rootTheme,
                // @ts-expect-error css variable
                '--grow': grow,
            }}
            onClick={handleSelect}
            isSelected={isSelected}
            transparent={transparent}
            ref={ref}
        >
            {children}
        </Root>
    );
});


export default BlockRoot;
