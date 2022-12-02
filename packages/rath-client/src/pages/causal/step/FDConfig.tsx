import { observer } from 'mobx-react-lite';
import type { FC } from 'react';
import FDPanel from '../functionalDependencies/FDPanel';


const CausalFDConfig: FC = () => {
    return (
        <>
            <FDPanel />
        </>
    );
};

export default observer(CausalFDConfig);
