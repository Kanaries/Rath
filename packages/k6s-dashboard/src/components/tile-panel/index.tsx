import { observer } from 'mobx-react-lite';
import styled from 'styled-components';
import TileView from './tile-view';


const Root = styled.div`
    width: 15%;
    min-width: 180px;
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
    return (
        <Root>
            <div>
                {'Tile'}
            </div>
            <TileView />
        </Root>
    );
});

export default TilePanel;
