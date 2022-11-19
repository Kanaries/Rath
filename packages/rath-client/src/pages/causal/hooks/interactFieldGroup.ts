import { useCallback, useState } from "react";
import { IFieldMeta } from "../../../interfaces";

/** 这是一个局部状态，不要在 causal page 以外的任何组件使用它 */
export function useInteractFieldGroups (fieldMetas: IFieldMeta[]) {
    const [fieldGroup, setFieldGroup] = useState<IFieldMeta[]>([]);
    const appendFields2Group = useCallback(
        (fids: string[]) => {
            // causalStore.setFocusNodeIndex(fieldMetas.findIndex((f) => f.fid === xFid));
            setFieldGroup((group) => {
                const nextGroup = [...group];
                for (let fid of fids) {
                    const fm = fieldMetas.find((f) => f.fid === fid);
                    if (fm && !nextGroup.find((f) => f.fid === fid)) {
                        nextGroup.push(fm);
                    }
                }
                return nextGroup;
            });
        },
        [setFieldGroup, fieldMetas]
    );

    const clearFieldGroup = useCallback(() => {
        setFieldGroup([]);
    }, [setFieldGroup]);

    return {
        fieldGroup,
        setFieldGroup,
        appendFields2Group,
        clearFieldGroup
    }
}