import { observer } from 'mobx-react-lite';
import { FC, useEffect, useState } from 'react';
import styled from 'styled-components';
import { getGlobalStore } from '../../../../store';
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
    const [expandTargets, setExpandTargets] = useState<string[]>([]);

    useEffect(() => {
        viewContext?.setLocalRenderData(null);
        context.__unsafeForceUploadModelWithOneHotEncoding(expandTargets).then(res => {
            if (res) {
                viewContext?.setLocalRenderData({ fields: res[1], pag: res[2] });
            }
        });
    }, [expandTargets, context, viewContext]);

    (window as any)['what'] = () => getGlobalStore().causalStore.dataset.allFields;
    (window as any)['exp'] = setExpandTargets;

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
