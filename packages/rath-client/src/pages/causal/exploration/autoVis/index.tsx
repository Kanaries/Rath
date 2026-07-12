import { FC, useCallback, useMemo } from 'react';
import { observer } from 'mobx-react-lite';
import styled from 'styled-components';
import { NodeSelectionMode, useCausalViewContext } from '../../../../store/causalStore/viewStore';
import { useGlobalStore } from '../../../../store';
import { IFieldMeta } from '../../../../interfaces';
import ViewField from '../../../megaAutomation/vizOperation/viewField';
import FieldPlaceholder from '../../../../components/fieldPill/fieldPlaceholder';
import MetaList from './metaList';
import Vis from './vis';
import NeighborList from './neighborList';

const Container = styled.div`
    display: flex;
    flex-direction: column;
    > * {
        flex-grow: 0;
        flex-shrink: 0;
        & header {
            font-size: 1rem;
            font-weight: 500;
            padding: 0.5em 0 0;
        }
    }
`;

const PillContainer = styled.div`
    display: flex;
    flex-direction: row;
    flex-wrap: wrap;
    > * {
        flex-grow: 0;
        flex-shrink: 0;
    }
`;

export interface IAutoVisProps {}

const AutoVis: FC<IAutoVisProps> = () => {
    const { causalStore } = useGlobalStore();
    const { fields } = causalStore.dataset;
    const viewContext = useCausalViewContext();

    const { graphNodeSelectionMode = NodeSelectionMode.NONE, selectedField = null, selectedFieldGroup = [] } = viewContext ?? {};

    const selectedFields = useMemo(() => {
        if (graphNodeSelectionMode === NodeSelectionMode.NONE) {
            return [];
        } else if (graphNodeSelectionMode === NodeSelectionMode.SINGLE) {
            return selectedField ? [selectedField] : [];
        } else {
            return selectedFieldGroup;
        }
    }, [graphNodeSelectionMode, selectedField, selectedFieldGroup]);

    const appendFieldHandler = useCallback(
        (fid: string) => {
            viewContext?.selectNode(fid);
        },
        [viewContext]
    );

    return (
        viewContext && (
            <Container>
                <div style={{ marginBottom: '0.8em' }}>
                    <PillContainer>
                        {selectedFields.map((f: IFieldMeta) => (
                            <ViewField
                                key={f.fid}
                                type={f.analyticType}
                                text={f.name || f.fid}
                                onRemove={() => {
                                    viewContext.toggleNodeSelected(f.fid);
                                }}
                            />
                        ))}
                        {graphNodeSelectionMode === NodeSelectionMode.MULTIPLE && <FieldPlaceholder fields={fields} onAdd={appendFieldHandler} />}
                    </PillContainer>
                </div>
                <div style={{ display: 'grid', gap: 30 }}>
                    <Vis />
                    <MetaList />
                    <NeighborList />
                </div>
            </Container>
        )
    );
};

export default observer(AutoVis);
