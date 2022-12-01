import { observer } from 'mobx-react-lite';
import { FC, useCallback, useRef, useState } from 'react';
import styled from 'styled-components';
import type { IFieldMeta } from '../../interfaces';
import { useGlobalStore } from '../../store';
import { useCausalViewProvider } from '../../store/causalStore/viewStore';
import type { IFunctionalDep } from './config';
import type { GraphNodeAttributes } from './explorer/graph-utils';
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

    // 结点可以 project 一些字段信息
    const renderNode = useCallback((node: Readonly<IFieldMeta>): GraphNodeAttributes | undefined => {
        const value = 2 / (1 + Math.exp(-1 * node.features.entropy / 2)) - 1;
        return {
            style: {
                stroke: `rgb(${Math.floor(95 * (1 - value))},${Math.floor(149 * (1 - value))},255)`,
            },
        };
    }, []);

    const submitRef = useRef(setFunctionalDependencies);
    submitRef.current = setFunctionalDependencies;
    const fdRef = useRef(functionalDependencies);
    fdRef.current = functionalDependencies;

    return (
        <div className="content-container">
            <ViewContextProvider>
                <Main className="card">
                    <h1 style={{ fontSize: '1.2rem', fontWeight: 500, marginBottom: '10px' }}>因果分析</h1>
                    <hr className="card-line" />
                    <CausalStepPager renderNode={renderNode} />
                </Main>
            </ViewContextProvider>
        </div>
    );
};

export default observer(CausalPage);
