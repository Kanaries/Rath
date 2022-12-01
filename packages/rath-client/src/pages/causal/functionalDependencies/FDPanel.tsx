import { observer } from 'mobx-react-lite';
import { FC, useCallback } from 'react';
import styled from 'styled-components';
import { useGlobalStore } from '../../../store';
import { IFunctionalDep } from '../config';
import FDBatch from './FDBatch';
import FDEditor from './FDEditor';


const Container = styled.div`
    overflow: hidden auto;
    padding: 0.4em 1.6em;
    & h3 {
        font-size: 0.8rem;
        font-weight: 500;
        padding: 0.4em 0;
        :not(:first-child) {
            margin-top: 0.4em;
        }
    }
`;

const FDPanel: FC = () => {
    const { causalStore } = useGlobalStore();
    const { functionalDependencies } = causalStore.model;

    const setFunctionalDependencies = useCallback((
        fdArr: IFunctionalDep[] | ((prev: readonly IFunctionalDep[] | null) => readonly IFunctionalDep[])
    ) => {
        causalStore.model.updateFunctionalDependencies(Array.isArray(fdArr) ? fdArr : fdArr(functionalDependencies));
    }, [causalStore, functionalDependencies]);

    return (
        <Container>
            <FDBatch />
            <FDEditor
                functionalDependencies={functionalDependencies}
                setFunctionalDependencies={setFunctionalDependencies}
            />
        </Container>
    );
};

export default observer(FDPanel);
