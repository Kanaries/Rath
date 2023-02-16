import intl from 'react-intl-universal';
import { observer } from 'mobx-react-lite';
import { FC, useCallback, useRef, useState } from 'react';
import styled from 'styled-components';
import { useGlobalStore } from '../../store';
import { useCausalViewProvider } from '../../store/causalStore/viewStore';
import { Card } from '../../components/card';
import type { IFunctionalDep } from './config';
import { CausalStepPager } from './step';


const Main = styled(Card)`
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
                <Main>
                    <h1 style={{ fontSize: '1.2rem', fontWeight: 500, marginBottom: '10px' }}>{intl.get('menu.causal')}</h1>
                    <hr className="card-line" />
                    <CausalStepPager />
                </Main>
            </ViewContextProvider>
        </div>
    );
};

export default observer(CausalPage);
