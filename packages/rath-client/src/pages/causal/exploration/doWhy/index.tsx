import type { FC } from 'react';
import styled from 'styled-components';
import ConfigPanel from './configPanel';
import { useDoWhyProvider } from './context';


const Container = styled.div``;

const DoWhy: FC = () => {
    const DoWhyProvider = useDoWhyProvider();

    return (
        <DoWhyProvider>
            <Container>
                <ConfigPanel />
            </Container>
        </DoWhyProvider>
    );
};


export default DoWhy;
