import { observer } from 'mobx-react-lite';
import { FC, useEffect } from 'react';
import styled from 'styled-components';
import { useCausalViewContext } from '../../../../store/causalStore/viewStore';
import AdvancedOptions from './advancedOptions';
import { useWhatIfContext, useWhatIfProvider } from './context';
import IfPanel from './ifPanel';


const Container = styled.div`
    width: 100%;
`;

const WhatIf: FC = () => {
    const DoWhyProvider = useWhatIfProvider();
    const viewContext = useCausalViewContext();
    const context = useWhatIfContext();

    useEffect(() => {
        if (viewContext) {
            const originRenderer = viewContext.onRenderNode;

            const WhatIfRenderer: typeof originRenderer = (node) => {
                const value = context?.conditions[node.fid] ?? context?.predication[node.fid];
                return value === undefined ? {} : {
                    
                    style: {
                        shadowColor: value === 0 ? undefined : value > 0 ? '#da3b01' : '#0027b4',
                        shadowBlur: 4,
                    },
                };
            };

            viewContext.setNodeRenderer(WhatIfRenderer);

            return () => {
                viewContext.setNodeRenderer(originRenderer);
            };
        }
    }, [viewContext, context]);

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
