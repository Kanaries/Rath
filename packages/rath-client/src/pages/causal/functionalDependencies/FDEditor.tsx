import { observer } from 'mobx-react-lite';
import React from 'react';
import FDGraph from './FDGraph';
import type { FDPanelProps } from './FDPanel';


const FDEditor: React.FC<FDPanelProps & { title?: string }> = ({
    context, functionalDependencies, setFunctionalDependencies, renderNode, title = '编辑视图',
}) => {
    return (
        <>
            <h3>{title}</h3>
            <FDGraph
                context={context}
                functionalDependencies={functionalDependencies}
                setFunctionalDependencies={setFunctionalDependencies}
                renderNode={renderNode}
            />
        </>
    );
};

export default observer(FDEditor);
