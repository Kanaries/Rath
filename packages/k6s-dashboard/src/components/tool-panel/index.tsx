import { observer } from 'mobx-react-lite';
import { useCallback } from 'react';
import styled from 'styled-components';
import { nanoid } from 'nanoid';
import { useEffect } from 'react';
import {
    FluentProvider,
    teamsDarkTheme,
    Menu,
    MenuItem,
    MenuList,
    MenuPopover,
    MenuTrigger,
    Toolbar,
    ToolbarButton,
    MenuDivider,
} from '@fluentui/react-components';
import { DocumentTextIcon, PlusIcon, PresentationChartLineIcon, StopIcon, TableCellsIcon, TrashIcon, VariableIcon, ViewColumnsIcon } from '@heroicons/react/24/outline';
import { useDashboardContext, useDashboardInfo } from '@store/index';
import { DashboardBlock, DashboardDataBlock } from 'src/interfaces';


const Root = styled.div`
    width: 100%;
    height: max-content;
    flex-grow: 0;
    flex-shrink: 0;
    overflow: hidden;
    display: flex;
    flex-direction: row;
    align-items: stretch;
    justify-content: space-between;
    background-color: #333;
    color: #eee;
`;

const ToolPanel = observer(function ToolPanel () {
    const info = useDashboardInfo();
    const dashboard = useDashboardContext();
    const { selections, spec } = dashboard;
    const container: DashboardBlock | null = selections.length === 0
        ? spec.items
        : (selections.length === 1 ? selections[0] : null);
    
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
        <FluentProvider theme={teamsDarkTheme}>
            <Root>
                <Toolbar>
                    <Menu>
                        <MenuTrigger>
                            <ToolbarButton disabled={!container} icon={<PlusIcon />} />
                        </MenuTrigger>
                        {container ? (
                            <MenuPopover>
                                <MenuList>
                                    <MenuItem
                                        onClick={() => dashboard.addBlock<DashboardDataBlock>(container.id, {
                                            id: nanoid(6),
                                            type: 'data',
                                            mode: 'vega',
                                            specification: {
                                                // @ts-expect-error this is ok
                                                "mark": {
                                                    "type": "circle",
                                                    "opacity": 0.66
                                                },
                                                "encoding": {
                                                    "y": {
                                                        "field": "c_11",
                                                        "type": "quantitative",
                                                        "title": "registered"
                                                    },
                                                    "x": {
                                                        "field": "c_10",
                                                        "type": "quantitative",
                                                        "title": "casual"
                                                    },
                                                    "color": {
                                                        "field": "c_15",
                                                        "type": "nominal",
                                                        "title": "workingday"
                                                    }
                                                },
                                            },
                                        })}
                                        icon={<PresentationChartLineIcon />}
                                    >
                                        {'chart'}
                                    </MenuItem>
                                    <MenuItem
                                        onClick={() => dashboard.addBlock(container.id, {
                                            id: nanoid(6),
                                            type: 'data',
                                            mode: 'result',
                                            title: '',
                                            target: '',
                                        })}
                                        disabled    // TODO: implement
                                        icon={<VariableIcon />}
                                    >
                                        {'result'}
                                    </MenuItem>
                                    <MenuItem
                                        onClick={() => dashboard.addBlock(container.id, {
                                            id: nanoid(6),
                                            type: 'data',
                                            mode: 'table',
                                            fields: [],
                                        })}
                                        disabled    // TODO: implement
                                        icon={<TableCellsIcon />}
                                    >
                                        {'table'}
                                    </MenuItem>
                                    <MenuDivider />
                                    <MenuItem
                                        onClick={() => dashboard.addBlock(container.id, {
                                            id: nanoid(6),
                                            type: 'layout',
                                            direction: 'vertical',
                                            children: [],
                                        })}
                                        icon={<ViewColumnsIcon style={{ transform: 'rotate(90deg)' }} />}
                                    >
                                        {'vertical layout'}
                                    </MenuItem>
                                    <MenuItem
                                        onClick={() => dashboard.addBlock(container.id, {
                                            id: nanoid(6),
                                            type: 'layout',
                                            direction: 'horizontal',
                                            children: [],
                                        })}
                                        icon={<ViewColumnsIcon />}
                                    >
                                        {'horizontal layout'}
                                    </MenuItem>
                                    <MenuItem
                                        onClick={() => dashboard.addBlock(container.id, { id: nanoid(6), type: 'blank' })}
                                        icon={<StopIcon />}
                                    >
                                        {'blank'}
                                    </MenuItem>
                                    <MenuDivider />
                                    <MenuItem
                                        onClick={() => dashboard.addBlock(container.id, {
                                            id: nanoid(6),
                                            type: 'text',
                                            content: '# I am header\n\nI am text\n\nHello, [Google](https://google.com/)',
                                        })}
                                        icon={<DocumentTextIcon />}
                                    >
                                        {'text'}
                                    </MenuItem>
                                </MenuList>
                            </MenuPopover>
                        ) : <></>}
                    </Menu>
                    <ToolbarButton disabled={selections.length === 0} icon={<TrashIcon />} onClick={removeSelected} />
                </Toolbar>
                <div>
                    {info.title}
                </div>
            </Root>
        </FluentProvider>
    );
});

export default ToolPanel;
