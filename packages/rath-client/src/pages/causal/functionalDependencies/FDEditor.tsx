import { observer } from 'mobx-react-lite';
import React from 'react';
import type { IFunctionalDep } from '../config';
import FDGraph from './FDGraph';
import type { FDPanelProps } from './FDPanel';


const FDEditor: React.FC<FDPanelProps & {
    title?: string;
    functionalDependencies: readonly IFunctionalDep[];
    setFunctionalDependencies: (fdArr: IFunctionalDep[] | ((prev: readonly IFunctionalDep[] | null) => readonly IFunctionalDep[])) => void;
}> = ({ functionalDependencies, setFunctionalDependencies, renderNode, title = '编辑视图' }) => {
    return (
        <>
            <h3>{title}</h3>
            <FDGraph
                functionalDependencies={functionalDependencies}
                setFunctionalDependencies={setFunctionalDependencies}
                renderNode={renderNode}
            />
        </>
    );
};

export default observer(FDEditor);
