import { observer } from 'mobx-react-lite';
import type { FC } from 'react';
import styled from 'styled-components';
import AdvancedOptions from './advancedOptions';
import { useWhatIfProvider } from './context';
import IfPanel from './ifPanel';


const Container = styled.div`
    width: 100%;
`;

const WhatIf: FC = () => {
    const DoWhyProvider = useWhatIfProvider();

    return (
        <DoWhyProvider>
            <Container>
                <AdvancedOptions />
                <IfPanel />
            </Container>
        </DoWhyProvider>
    );
};


export default observer(WhatIf);
