import { observer } from "mobx-react-lite";
import styled from "styled-components";
import { Card } from "../../components/card";
import { useGlobalStore } from "../../store";
import ControlPanel from "./components/controlPanel";
import DataOverview from "./components/dataOverview";
import { useBreakoutContext } from "./store";


const Outer = styled.div`
    padding: 1rem;
`;

const Content = styled(Card)`
    display: flex;
    flex-direction: column;
    > * {
        margin-block: 1rem;
    }
`;

const BreakoutPage = observer(function BreakoutPage () {
    const { dataSourceStore } = useGlobalStore();
    const BreakoutContext = useBreakoutContext(dataSourceStore);

    return (
        <BreakoutContext.BreakoutProvider>
            <Outer>
                <Content>
                    <ControlPanel />
                    <DataOverview />
                </Content>
            </Outer>
        </BreakoutContext.BreakoutProvider>
    );
});


export default BreakoutPage;
