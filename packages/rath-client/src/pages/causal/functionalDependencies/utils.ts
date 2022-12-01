import { notify } from "../../../components/error";
import type { IRow } from "../../../interfaces";
import { getGlobalStore } from "../../../store";
import type { IFunctionalDep } from "../config";


// FIXME: path
const AutoDetectionApiPath = 'autoDetect';

export const getGeneratedFDFromAutoDetection = async (
    dataSource: readonly IRow[],
    fields: string[],
): Promise<IFunctionalDep[]> => {
    try {
        const { causalStore } = getGlobalStore();
        const { causalServer } = causalStore.operator;
        const { allFields } = causalStore.dataset;
        const res = await fetch(`${causalServer}/${AutoDetectionApiPath}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            // FIXME: I have no idea what is the payload
            body: JSON.stringify({
                dataSource,
                fields: allFields,
                focusedFields: fields,
            }),
        });
        const result = await res.json();
        if (result.success) {
            return result.data;
        } else {
            throw new Error(result.message);
        }
        // // FIXME: mock data
        // await new Promise(resolve => setTimeout(resolve, 2_000));
        // const selectedFields = allFields.filter(f => fields.includes(f.fid));
        // const fidArr = selectedFields.map(f => f.fid);
        // const list: ModifiableBgKnowledge[] = [];
        // while (list.length < 6 && fidArr.length >= 2) {
        //     const srcIdx = Math.floor(Math.random() * fidArr.length);
        //     const tarIdx = (srcIdx + Math.floor(Math.random() * (fidArr.length - 1))) % fidArr.length;
        //     if (srcIdx !== tarIdx) {
        //         list.push({
        //             src: fidArr[srcIdx],
        //             tar: fidArr[tarIdx],
        //             type: (['must-link', 'must-not-link', 'directed-must-link', 'directed-must-not-link'] as const)[
        //                 Math.floor(Math.random() * 4)
        //             ],
        //         });
        //     }
        //     fidArr.splice(srcIdx, 1);
        // }
        // return list;
    } catch (error) {
        notify({
            title: 'Causal Preconditions Auto Detection Error',
            type: 'error',
            content: `${error}`,
        });
        return [];
    }
};
