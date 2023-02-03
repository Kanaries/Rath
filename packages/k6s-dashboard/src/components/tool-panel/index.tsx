import { observer } from 'mobx-react-lite';
import { useCallback } from 'react';
import { DashboardLayoutBlock } from 'src/interfaces';
import styled from 'styled-components';
import { nanoid } from 'nanoid';
import { useDashboardContext, useDashboardInfo } from '@store/index';
import { useEffect } from 'react';


const Root = styled.div`
    width: 100%;
    height: 2.6rem;
    flex-grow: 0;
    flex-shrink: 0;
    overflow: hidden;
    display: flex;
    flex-direction: row;
    align-items: stretch;
    background-color: #333;
    color: #eee;
`;

const ToolPanel = observer(function ToolPanel () {
    const info = useDashboardInfo();
    const dashboard = useDashboardContext();
    const { selections, spec } = dashboard;
    const container: DashboardLayoutBlock | null = selections.length === 0
        ? spec.items
        : (selections.length === 1 && selections[0]?.type === 'layout' ? selections[0] as DashboardLayoutBlock : null);
    
    const removeSelected = useCallback(() => {
        const { selections: list } = dashboard;
        if (list.length === 0) {
            return;
        }
        for (const { id } of list) {
            dashboard.removeBlock(id);
        }
    }, [dashboard]);

    useEffect(() => {
        const cb = (ev: KeyboardEvent): void => {
            if (ev.key === 'Backspace' || ev.key === 'Delete') {
                removeSelected();
            }
        };
        document.body.addEventListener('keydown', cb);
        return () => {
            document.body.removeEventListener('keydown', cb);
        };
    }, [removeSelected]);

    return (
        <Root>
            <div>
                {info.title}
            </div>
            <div>
                {container && (
                    <>
                        <button
                            onClick={() => dashboard.addBlock(container, {
                                id: nanoid(6),
                                type: 'layout',
                                direction: 'vertical',
                                children: [],
                            })}
                        >
                            {'+ vertical layout'}
                        </button>
                        <button
                            onClick={() => dashboard.addBlock(container, {
                                id: nanoid(6),
                                type: 'layout',
                                direction: 'horizontal',
                                children: [],
                            })}
                        >
                            {'+ horizontal layout'}
                        </button>
                        <button
                            onClick={() => dashboard.addBlock(container, { id: nanoid(6), type: 'blank' })}
                        >
                            {'+ blank'}
                        </button>
                        <button
                            onClick={() => dashboard.addBlock(container, {
                                id: nanoid(6),
                                type: 'text',
                                contents: [
                                    {
                                        role: 'header',
                                        value: ['I am header'],
                                    },
                                    {
                                        role: 'explanation',
                                        value: ['I am text'],
                                    },
                                    {
                                        value: [
                                            'Hello, ',
                                            {
                                                text: 'Google',
                                                link: 'https://google.com/',
                                            },
                                        ],
                                    },
                                ],
                            })}
                        >
                            {'+ text'}
                        </button>
                    </>
                )}
                {selections.length > 0 && (
                    <button
                        onClick={removeSelected}
                    >
                        {'delete'}
                    </button>
                )}
            </div>
        </Root>
    );
});

export default ToolPanel;
