import { notify } from "../../../components/error";
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
        // const res = await fetch(`${apiPrefix}/${AutoDetectionApiPath}`, {
        //     method: 'POST',
        //     headers: {
        //         'Content-Type': 'application/json',
        //     },
        //     // FIXME: payload
        //     body: JSON.stringify({
        //         dataSource,
        //         fields: fieldMetas,
        //         focusedFields: fields,
        //     }),
        // });
        // const result = await res.json();
        // if (result.success) {
        //     return result.data;
        // } else {
        //     throw new Error(result.message);
        // }
        // FIXME: mock data
        await new Promise(resolve => setTimeout(resolve, 2_000));
        const selectedFields = fieldMetas.filter(f => fields.includes(f.fid));
        const fidArr = selectedFields.map(f => f.fid);
        const list: ModifiableBgKnowledge[] = [];
        while (list.length < 6 && fidArr.length >= 2) {
            const srcIdx = Math.floor(Math.random() * fidArr.length);
            const tarIdx = (srcIdx + Math.floor(Math.random() * (fidArr.length - 1))) % fidArr.length;
            if (srcIdx !== tarIdx) {
                list.push({
                    src: fidArr[srcIdx],
                    tar: fidArr[tarIdx],
                    type: (['must-link', 'must-not-link', 'directed-must-link', 'directed-must-not-link'] as const)[
                        Math.floor(Math.random() * 4)
                    ],
                });
            }
            fidArr.splice(srcIdx, 1);
        }
        return list;
    } catch (error) {
        notify({
            title: 'Causal Preconditions Auto Detection Error',
            type: 'error',
            content: `${error}`,
        });
        return [];
    }
};
