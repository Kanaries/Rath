import { observer } from 'mobx-react-lite';
import React from 'react';
import type { IFieldMeta } from '../../../interfaces';
import type { GraphNodeAttributes } from '../explorer/graph-utils';
import FDPanel from '../functionalDependencies/FDPanel';


export interface CausalFDConfigProps {
    renderNode: (node: Readonly<IFieldMeta>) => GraphNodeAttributes | undefined;
}

const CausalFDConfig: React.FC<CausalFDConfigProps> = ({ renderNode }) => {
    return (
        <>
            <FDPanel renderNode={renderNode} />
        </>
    );
};

export default observer(CausalFDConfig);
