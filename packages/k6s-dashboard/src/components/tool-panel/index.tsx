import { useDashboardInfo } from '@store/index';
import { observer } from 'mobx-react-lite';
import styled from 'styled-components';


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

    return (
        <Root>
            <div>
                {info.title}
            </div>
        </Root>
    );
});

export default ToolPanel;
