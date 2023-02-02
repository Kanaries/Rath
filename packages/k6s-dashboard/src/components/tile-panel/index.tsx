import { useDashboardContext } from '@store/index';
import { observer } from 'mobx-react-lite';
import styled from 'styled-components';
import type { DashboardLayoutBlock } from 'src/interfaces';
import TileView from './tile-view';


const Root = styled.div`
    min-width: 20%;
    height: 100%;
    flex-grow: 0;
    flex-shrink: 0;
    overflow: hidden;
    display: flex;
    flex-direction: column;
    align-items: stretch;
    box-sizing: border-box;
    border-inline: 1px solid #aaa;
`;

const TilePanel = observer(function TilePanel () {
    const dashboard = useDashboardContext();
    const { selections, spec } = dashboard;
    const container: DashboardLayoutBlock | null = selections.length === 0
        ? spec.items
        : (selections.length === 1 && selections[0]?.type === 'layout' ? selections[0] as DashboardLayoutBlock : null);

    return (
        <Root>
            <div>
                {'Tile'}
            </div>
            <div>
                <TileView />
            </div>
            {container && (
                <>
                    <button
                        onClick={() => dashboard.addBlock(container, {
                            type: 'layout',
                            direction: 'vertical',
                            children: [],
                        })}
                    >
                        {'+ vertical layout'}
                    </button>
                    <button
                        onClick={() => dashboard.addBlock(container, {
                            type: 'layout',
                            direction: 'horizontal',
                            children: [],
                        })}
                    >
                        {'+ horizontal layout'}
                    </button>
                    <button
                        onClick={() => dashboard.addBlock(container, { type: 'blank' })}
                    >
                        {'+ blank'}
                    </button>
                    <button
                        onClick={() => dashboard.addBlock(container, {
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
        </Root>
    );
});

export default TilePanel;
