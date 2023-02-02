import { observer } from 'mobx-react-lite';
import styled from 'styled-components';


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

const InspectPanel = observer(function InspectPanel () {

    return (
        <Root>
            <div>
                {'Inspect'}
            </div>
        </Root>
    );
});

export default InspectPanel;
