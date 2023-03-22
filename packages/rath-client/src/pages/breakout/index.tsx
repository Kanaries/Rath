import { observer } from "mobx-react-lite";
import { useEffect } from "react";
import styled from "styled-components";
import { Card } from "../../components/card";
import { useGlobalStore } from "../../store";
import ControlPanel from "./components/controlPanel";
import DataOverview from "./components/dataOverview";
import DivisionList from "./components/divisionList";
import { type CompareBase, type CompareTarget, useBreakoutContext } from "./store";


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

interface IBreakoutPageProps {
    defaultCompareTarget?: Readonly<CompareTarget> | null;
    defaultCompareBase?: CompareBase;
}

const BreakoutPage = observer<IBreakoutPageProps>(function BreakoutPage ({ defaultCompareTarget, defaultCompareBase }) {
    const { dataSourceStore } = useGlobalStore();
    const BreakoutContext = useBreakoutContext(dataSourceStore);

    useEffect(() => {
        if (defaultCompareTarget !== undefined) {
            BreakoutContext.value.setCompareTarget(defaultCompareTarget);
        }
    }, [defaultCompareTarget, BreakoutContext]);

    useEffect(() => {
        if (defaultCompareBase !== undefined) {
            BreakoutContext.value.setCompareBase(defaultCompareBase);
        }
    }, [defaultCompareBase, BreakoutContext]);

    return (
        <BreakoutContext.BreakoutProvider>
            <Outer>
                <Content>
                    <ControlPanel />
                    <DataOverview />
                    <DivisionList />
                </Content>
            </Outer>
        </BreakoutContext.BreakoutProvider>
    );
});


export default BreakoutPage;
