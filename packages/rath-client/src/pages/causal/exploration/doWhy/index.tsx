import type { FC } from 'react';
import styled from 'styled-components';
import ConfigPanel from './configPanel';
import ConsoleTable from './consoleTable';
import { useDoWhyProvider } from './context';


const Container = styled.div`
    width: 100%;
`;

const DoWhy: FC = () => {
    const DoWhyProvider = useDoWhyProvider();

    return (
        <DoWhyProvider>
            <Container>
                <ConfigPanel />
                <ConsoleTable />
            </Container>
        </DoWhyProvider>
    );
};


export default DoWhy;
