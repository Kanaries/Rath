import { observer } from 'mobx-react-lite';
import React from 'react';
import type { IFieldMeta } from '../../../interfaces';
import type { IFunctionalDep } from '../config';
import type { useDataViews } from '../hooks/dataViews';
import type { GraphNodeAttributes } from '../explorer/graph-utils';
import FDPanel from '../functionalDependencies/FDPanel';


export interface CausalFDConfigProps {
    dataContext: ReturnType<typeof useDataViews>;
    functionalDependencies: IFunctionalDep[];
    setFunctionalDependencies: (fdArr: IFunctionalDep[] | ((prev: IFunctionalDep[]) => IFunctionalDep[])) => void;
    renderNode: (node: Readonly<IFieldMeta>) => GraphNodeAttributes | undefined;
}

const CausalFDConfig: React.FC<CausalFDConfigProps> = ({
    dataContext,
    functionalDependencies,
    setFunctionalDependencies,
    renderNode,
}) => {
    return (
        <>
            <FDPanel
                context={dataContext}
                functionalDependencies={functionalDependencies}
                setFunctionalDependencies={setFunctionalDependencies}
                renderNode={renderNode}
            />
        </>
    );
};

export default observer(CausalFDConfig);
