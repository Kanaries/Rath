import type { FC } from 'react';
import styled from 'styled-components';
import ConfigPanel from './configPanel';
import ConsoleTable from './consoleTable';
import { useHypothesisTestProvider } from './context';


const Container = styled.div`
    width: 100%;
`;

const HypothesisTest: FC = () => {
    const DoWhyProvider = useHypothesisTestProvider();

    return (
        <DoWhyProvider>
            <Container>
                <ConfigPanel />
                <ConsoleTable />
            </Container>
        </DoWhyProvider>
    );
};


export default HypothesisTest;
