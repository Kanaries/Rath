import { observer } from 'mobx-react-lite';
import { FC, useCallback, useRef, useState } from 'react';
import styled from 'styled-components';
import { useGlobalStore } from '../../store';
import { useCausalViewProvider } from '../../store/causalStore/viewStore';
import type { IFunctionalDep } from './config';
import { getI18n } from './locales';
import NoConnection from './noConnection';
import { CausalStepPager } from './step';


const Main = styled.div`
    height: calc(100vh - 70px);
    display: flex;
    flex-direction: column;
    overflow: hidden;
    > h1 {
        flex-grow: 0;
        flex-shrink: 0;
    }
`;

const CausalPage: FC = () => {
    const { causalStore } = useGlobalStore();
    const { serverActive } = causalStore.operator;

    const ViewContextProvider = useCausalViewProvider(causalStore);

    const [functionalDependencies, __unsafeSetFunctionalDependencies] = useState<IFunctionalDep[]>([]);

    const setFunctionalDependencies = useCallback((next: IFunctionalDep[] | ((prev: IFunctionalDep[]) => IFunctionalDep[])) => {
        __unsafeSetFunctionalDependencies(prev => {
            const list = typeof next === 'function' ? next(prev) : next;
            return list.reduce<IFunctionalDep[]>((deps, dep) => {
                return deps.concat([dep]);
            }, []);
        });
    }, []);

    const submitRef = useRef(setFunctionalDependencies);
    submitRef.current = setFunctionalDependencies;
    const fdRef = useRef(functionalDependencies);
    fdRef.current = functionalDependencies;

    return (
        <div className="content-container">
            <ViewContextProvider>
                <Main className="card">
                    <h1 style={{ fontSize: '1.2rem', fontWeight: 500, marginBottom: '10px' }}>
                        {getI18n('title')}
                    </h1>
                    <hr className="card-line" />
                    {serverActive || <NoConnection />}
                    <CausalStepPager />
                </Main>
            </ViewContextProvider>
        </div>
    );
};

export default observer(CausalPage);
