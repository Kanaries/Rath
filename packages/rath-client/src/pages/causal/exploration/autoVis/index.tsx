import { FC, useCallback, useMemo } from "react";
import { IPattern } from "@kanaries/loa";
import { observer } from "mobx-react-lite";
import { Stack } from "@fluentui/react";
import { toJS } from "mobx";
import styled from "styled-components";
import { NodeSelectionMode, useCausalViewContext } from "../../../../store/causalStore/viewStore";
import { distVis } from "../../../../queries/distVis";
import ErrorBoundary from "../../../../components/visErrorBoundary";
import ReactVega from "../../../../components/react-vega";
import { useGlobalStore } from "../../../../store";
import { IFieldMeta } from "../../../../interfaces";
import ViewField from "../../../megaAutomation/vizOperation/viewField";
import FieldPlaceholder from "../../../../components/fieldPlaceholder";


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
    const { visSample, fields } = causalStore.dataset;
    const viewContext = useCausalViewContext();

    const {
        graphNodeSelectionMode = NodeSelectionMode.NONE, selectedField = null, selectedFieldGroup = []
    } = viewContext ?? {};

    const selectedFields = useMemo(() => {
        if (graphNodeSelectionMode === NodeSelectionMode.NONE) {
            return [];
        } else if (graphNodeSelectionMode === NodeSelectionMode.SINGLE) {
            return selectedField ? [selectedField] : [];
        } else {
            return selectedFieldGroup;
        }
    }, [graphNodeSelectionMode, selectedField, selectedFieldGroup]);

    const viewPattern = useMemo<IPattern | null>(() => {
        if (selectedFields.length === 0) {
            return null;
        }
        return {
            fields: selectedFields,
            imp: selectedFields[0].features.entropy,
        };
    }, [selectedFields]);

    const viewSpec = useMemo(() => {
        if (viewPattern === null) {
            return null;
        }
        return distVis({
            pattern: toJS(viewPattern),
            interactive: true,
            specifiedEncodes: viewPattern.encodes,
        });
    }, [viewPattern]);

    const appendFieldHandler = useCallback((fid: string) => {
        viewContext?.selectNode(fid);
    }, [viewContext]);

    return viewContext && (
        <>
            <Stack>
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
                    {graphNodeSelectionMode === NodeSelectionMode.MULTIPLE && (
                        <FieldPlaceholder fields={fields} onAdd={appendFieldHandler} />
                    )}
                </PillContainer>
            </Stack>
            <Stack tokens={{ childrenGap: 10 }} >
                {viewSpec && (
                    <ErrorBoundary>
                        <ReactVega actions={false} spec={viewSpec} dataSource={visSample} />
                    </ErrorBoundary>
                )}
            </Stack>
        </>
    );
};


export default observer(AutoVis);
