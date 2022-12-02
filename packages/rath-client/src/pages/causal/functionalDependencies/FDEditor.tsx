import { observer } from 'mobx-react-lite';
import type { FC } from 'react';
import type { IFunctionalDep } from '../config';
import FDGraph from './FDGraph';


const FDEditor: FC<{
    title?: string;
    functionalDependencies: readonly IFunctionalDep[];
    setFunctionalDependencies: (fdArr: IFunctionalDep[] | ((prev: readonly IFunctionalDep[] | null) => readonly IFunctionalDep[])) => void;
}> = ({ functionalDependencies, setFunctionalDependencies, title = '编辑视图' }) => {
    return (
        <>
            <h3>{title}</h3>
            <FDGraph
                functionalDependencies={functionalDependencies}
                setFunctionalDependencies={setFunctionalDependencies}
            />
        </>
    );
};

export default observer(FDEditor);
