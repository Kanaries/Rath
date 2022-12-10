import { observer } from 'mobx-react-lite';
import { FC, useEffect } from 'react';
import styled from 'styled-components';
import { useCausalViewContext } from '../../../../store/causalStore/viewStore';
import AdvancedOptions from './advancedOptions';
import { useWhatIfProviderAndContext } from './context';
import IfPanel from './ifPanel';


const Container = styled.div`
    width: 100%;
`;

const WhatIf: FC = () => {
    const [DoWhyProvider, context] = useWhatIfProviderAndContext();
    const viewContext = useCausalViewContext();

    useEffect(() => {
        viewContext?.setLocalRenderData(null);
        viewContext?.addEventListener('nodeDoubleClick', node => {
            context.toggleExpand(node).then(res => {
                if (res) {
                    viewContext?.setLocalRenderData({ fields: res[1], pag: res[2] });
                    viewContext?.graph?.refresh();
                } else {
                    viewContext?.setLocalRenderData(null);
                }
            });
        });
        return () => {
            viewContext?.setLocalRenderData(null);
        };
    }, [context, viewContext]);

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
