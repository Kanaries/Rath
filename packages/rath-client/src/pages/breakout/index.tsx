import type { IFilter } from "@kanaries/loa";
import { observer } from "mobx-react-lite";
import { useEffect } from "react";
import styled from "styled-components";
import { Card } from "../../components/card";
import { useGlobalStore } from "../../store";
import ControlPanel from "./components/controlPanel";
import DataOverview from "./components/dataOverview";
import DivisionList from "./components/divisionList";
import { type BreakoutMainField, useBreakoutContext } from "./store";


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
    defaultMainField?: Readonly<BreakoutMainField> | null;
    defaultMainFieldFilters?: IFilter[];
    defaultComparisonFilters?: IFilter[];
}

const BreakoutPage = observer<IBreakoutPageProps>(function BreakoutPage ({
    defaultMainField, defaultMainFieldFilters, defaultComparisonFilters
}) {
    const { dataSourceStore } = useGlobalStore();
    const { cleanedData, fieldMetas } = dataSourceStore;
    const BreakoutContext = useBreakoutContext(cleanedData, fieldMetas);

    useEffect(() => {
        if (defaultMainField !== undefined) {
            BreakoutContext.value.setMainField(defaultMainField);
        }
    }, [defaultMainField, BreakoutContext]);

    useEffect(() => {
        if (defaultMainFieldFilters !== undefined) {
            BreakoutContext.value.setComparisonFilters(defaultMainFieldFilters);
        }
    }, [defaultMainFieldFilters, BreakoutContext]);

    useEffect(() => {
        if (defaultComparisonFilters !== undefined) {
            BreakoutContext.value.setComparisonFilters(defaultComparisonFilters);
        }
    }, [defaultComparisonFilters, BreakoutContext]);

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
