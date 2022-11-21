import type { IFieldMeta, IRow } from "../../../interfaces";
import { getGlobalStore } from "../../../store";
import type { ModifiableBgKnowledge } from "../config";


export const getGeneratedPreconditionsFromExtInfo = (fields: IFieldMeta[]): ModifiableBgKnowledge[] => {
    return fields.reduce<ModifiableBgKnowledge[]>((list, f) => {
        if (f.extInfo) {
            for (const from of f.extInfo.extFrom) {
                list.push({
                    src: from,
                    tar: f.fid,
                    type: 'directed-must-link',
                });
            }
        }
        return list;
    }, []);
};

// FIXME: path
const AutoDetectionApiPath = 'autoDetect';

export const getGeneratedPreconditionsFromAutoDetection = async (
    dataSource: IRow[],
    fields: string[],
): Promise<ModifiableBgKnowledge[]> => {
    try {
        const { causalStore, dataSourceStore } = getGlobalStore();
        const { apiPrefix } = causalStore;
        const { fieldMetas } = dataSourceStore;
        const res = await fetch(`${apiPrefix}/${AutoDetectionApiPath}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            // FIXME: payload
            body: JSON.stringify({
                dataSource,
                fields: fieldMetas,
                focusedFields: fields,
            }),
        });
        const result = await res.json();
        if (result.success) {
            return result.data;
        } else {
            throw new Error(result.message);
        }
    } catch (error) {
        console.error(error);
        return [];
    }
};
