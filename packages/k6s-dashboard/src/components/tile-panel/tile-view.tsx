import { observer } from 'mobx-react-lite';
import styled from 'styled-components';
import { useDashboardContext } from '@store/index';
import type { DashboardBlock } from 'src/interfaces';


const Item = styled.div``;

const ItemList = styled.div`
    display: flex;
    flex-direction: column;
    font-size: 0.9rem;
    user-select: none;
`;

const ItemHeader = styled.div<{ isSelected: boolean }>`
    cursor: pointer;
    background-color: ${({ isSelected }) => isSelected ? '#ddf' : '#eee'};
    :hover {
        filter: brightness(0.9);
    }
    display: flex;
    > * {
        flex-grow: 0;
        flex-shrink: 0;
    }
`;

const ItemSpin = styled.div`
    width: 1em;
    margin-right: 0.2em;
    text-align: center;
    user-select: none;
    pointer-events: none;
`;

const TileList = observer<{ items: DashboardBlock[]; level: number }>(function TileList ({ items, level }) {
    const dashboard = useDashboardContext();
    const { selections } = dashboard;

    return (
        <ItemList>
            {items.map((item, i) => {
                const isSelected = selections.some(which => which === item);

                if (item.type === 'layout') {
                    return (
                        <Item key={i}>
                            <ItemHeader
                                isSelected={isSelected}
                                style={{ paddingLeft: `${level + 1}em` }}
                                onClick={e => {
                                    e.stopPropagation();
                                    dashboard.toggleSelect(item, e.shiftKey);
                                }}
                            >
                                <ItemSpin>+</ItemSpin>
                                <span>{item.type}</span>
                            </ItemHeader>
                            <TileList level={level + 1} items={item.children} />
                        </Item>
                    );
                }
                return (
                    <Item key={i}>
                        <ItemHeader
                            isSelected={isSelected}
                            style={{ paddingLeft: `${level + 1}em` }}
                            onClick={e => {
                                e.stopPropagation();
                                dashboard.toggleSelect(item, e.shiftKey);
                            }}
                        >
                            <ItemSpin />
                            <span>{item.type}</span>
                        </ItemHeader>
                    </Item>
                );
            })}
        </ItemList>
    );
});

const TileView = observer(function TileView () {
    const dashboard = useDashboardContext();
    const root = dashboard.spec.items;

    return (
        <div style={{ overflow: 'auto' }}>
            <TileList level={0} items={[root]} />
        </div>
    );
});


export default TileView;
