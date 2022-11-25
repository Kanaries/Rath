import { observer } from 'mobx-react-lite';
import React, { useCallback, useEffect, useState } from 'react';
import styled from 'styled-components';
import type { IFieldMeta } from '../../interfaces';
import { useGlobalStore } from '../../store';
import type { IFunctionalDep, ModifiableBgKnowledge } from './config';
import { useInteractFieldGroups } from './hooks/interactFieldGroup';
import { useDataViews } from './hooks/dataViews';
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

const CausalPage: React.FC = () => {
    const { dataSourceStore, causalStore } = useGlobalStore();
    const { fieldMetas, cleanedData } = dataSourceStore;
    const interactFieldGroups = useInteractFieldGroups(fieldMetas);

    useEffect(() => {
        causalStore.setFocusFieldIds(
            fieldMetas
                .filter((f) => f.disable !== true)
                .slice(0, 10)
                .map((f) => f.fid)
        ); // 默认只使用前 10 个)
    }, [fieldMetas, causalStore]);

    const [modifiablePrecondition, __unsafeSetModifiablePrecondition] = useState<ModifiableBgKnowledge[]>([]);

    const setModifiablePrecondition = useCallback((next: ModifiableBgKnowledge[] | ((prev: ModifiableBgKnowledge[]) => ModifiableBgKnowledge[])) => {
        __unsafeSetModifiablePrecondition(prev => {
            const list = typeof next === 'function' ? next(prev) : next;
            return list.reduce<ModifiableBgKnowledge[]>((links, link) => {
                if (link.src === link.tar) {
                    // 禁止自环边
                    return links;
                }
                const overloadIdx = links.findIndex(
                    which => [which.src, which.tar].every(node => [link.src, link.tar].includes(node))
                );
                if (overloadIdx !== -1) {
                    const temp = links.map(l => l);
                    temp.splice(overloadIdx, 1, link);
                    return temp;
                } else {
                    return links.concat([link]);
                }
            }, []);
        });
    }, []);

    const [functionalDependencies, __unsafeSetFunctionalDependencies] = useState<IFunctionalDep[]>([]);

    const setFunctionalDependencies = useCallback((next: IFunctionalDep[] | ((prev: IFunctionalDep[]) => IFunctionalDep[])) => {
        __unsafeSetFunctionalDependencies(prev => {
            const list = typeof next === 'function' ? next(prev) : next;
            return list.reduce<IFunctionalDep[]>((deps, dep) => {
                return deps.concat([dep]);
            }, []);
        });
    }, []);

    const dataContext = useDataViews(cleanedData);

    useEffect(() => {
        causalStore.updateCausalAlgorithmList(fieldMetas);
    }, [causalStore, fieldMetas]);

    // 结点可以 project 一些字段信息
    const renderNode = useCallback((node: Readonly<IFieldMeta>): GraphNodeAttributes | undefined => {
        const value = 2 / (1 + Math.exp(-1 * node.features.entropy / 2)) - 1;
        return {
            style: {
                stroke: `rgb(${Math.floor(95 * (1 - value))},${Math.floor(149 * (1 - value))},255)`,
            },
        };
    }, []);

    return (
        <div className="content-container">
            <Main className="card">
                <h1 style={{ fontSize: '1.2rem', fontWeight: 500, marginBottom: '10px' }}>因果分析</h1>
                <hr className="card-line" />
                <CausalStepPager
                    dataContext={dataContext}
                    modifiablePrecondition={modifiablePrecondition}
                    setModifiablePrecondition={setModifiablePrecondition}
                    functionalDependencies={functionalDependencies}
                    setFunctionalDependencies={setFunctionalDependencies}
                    renderNode={renderNode}
                    interactFieldGroups={interactFieldGroups}
                />
            </Main>
        </div>
    );
};

export default observer(CausalPage);
