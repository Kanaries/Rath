import type { IFilter } from "@kanaries/loa";
import { observer } from "mobx-react-lite";
import styled from "styled-components";
import { Card } from "../../components/card";
import { useGlobalStore } from "../../store";
import AIQuery from "./components/aiQuery";
import DataOverview from "./components/dataOverview";
import DivisionList from "./components/divisionList";
import { type BreakoutMainField, useBreakoutContext } from "./store";
import { useDefaultConfigs } from "./utils";


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

export interface IBreakoutPageProps {
    defaultMainField?: Readonly<BreakoutMainField> | null;
    defaultMainFieldFilters?: IFilter[];
    defaultComparisonFilters?: IFilter[];
}

const BreakoutPage = observer<IBreakoutPageProps>(function BreakoutPage (props) {
    const { dataSourceStore } = useGlobalStore();
    const { cleanedData, fieldMetas } = dataSourceStore;
    const BreakoutContext = useBreakoutContext(cleanedData, fieldMetas);

    useDefaultConfigs(BreakoutContext.value, props);

    return (
        <BreakoutContext.BreakoutProvider>
            <Outer>
                <Content>
                    <AIQuery />
                    <DataOverview />
                    <DivisionList />
                </Content>
            </Outer>
        </BreakoutContext.BreakoutProvider>
    );
});


export default BreakoutPage;
