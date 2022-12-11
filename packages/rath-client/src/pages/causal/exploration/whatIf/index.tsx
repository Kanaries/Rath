import { observer } from 'mobx-react-lite';
import { FC, useEffect } from 'react';
import styled from 'styled-components';
import { useGlobalStore } from '../../../../store';
import { useCausalViewContext } from '../../../../store/causalStore/viewStore';
import AdvancedOptions from './advancedOptions';
import { useWhatIfProviderAndContext } from './context';
import IfPanel from './ifPanel';


const Container = styled.div`
    width: 100%;
`;

const WhatIf: FC = () => {
    const { causalStore: { dataset } } = useGlobalStore();
    const [DoWhyProvider, context] = useWhatIfProviderAndContext();
    const viewContext = useCausalViewContext();

    useEffect(() => {
        viewContext?.addEventListener('nodeDoubleClick', node => {
            dataset.toggleExpand(node);
        });
    }, [context, viewContext, dataset]);

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
