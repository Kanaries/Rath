import { FC, useCallback, useEffect, useMemo, useState } from "react";
import { observer } from "mobx-react-lite";
import { Stack, Toggle } from "@fluentui/react";
import styled from "styled-components";
import { NodeSelectionMode, useCausalViewContext } from "../../../../store/causalStore/viewStore";
import MetaList from "../../../dataSource/profilingView/metaList";
import MetaDetail from "../../../dataSource/profilingView/metaDetail";


const MetaListContainer = styled.div`
    display: flex;
    width: 100%;
    overflow-x: auto;
    /* border-top: 1px solid #eee;
    margin-top: 8px; */
`;

export interface IAutoVisProps {}

const AutoVis: FC<IAutoVisProps> = () => {
    const viewContext = useCausalViewContext();
    const toggleSelectionMode = useCallback(() => {
        if (viewContext) {
            const { graphNodeSelectionMode } = viewContext;
            viewContext.setNodeSelectionMode(graphNodeSelectionMode === NodeSelectionMode.MULTIPLE ? NodeSelectionMode.SINGLE : NodeSelectionMode.MULTIPLE);
        }
    }, [viewContext]);

    const fields = useMemo(() => {
        if (!viewContext || viewContext.graphNodeSelectionMode === NodeSelectionMode.NONE) {
            return [];
        } else if (viewContext.graphNodeSelectionMode === NodeSelectionMode.SINGLE) {
            return viewContext.selectedField ? [viewContext.selectedField] : [];
        } else {
            return viewContext.selectedFieldGroup;
        }
    }, [viewContext]);

    const [fieldIndex, setFieldIndex] = useState(0);
    useEffect(() => {
        setFieldIndex(0);
    }, [fields]);

    return viewContext && (
        <>
            <Stack>
                <Toggle
                    label="多选"
                    checked={viewContext.graphNodeSelectionMode === NodeSelectionMode.MULTIPLE}
                    onChange={toggleSelectionMode}
                />
            </Stack>
            <Stack tokens={{ childrenGap: 10 }} >
                <MetaListContainer>
                    <MetaList fieldMetas={fields} columnIndex={fieldIndex} onColumnIndexChange={idx => setFieldIndex(idx)} />
                    {fields[fieldIndex] && <MetaDetail field={fields[fieldIndex]} />}
                </MetaListContainer>
            </Stack>
        </>
    );
};


export default observer(AutoVis);
