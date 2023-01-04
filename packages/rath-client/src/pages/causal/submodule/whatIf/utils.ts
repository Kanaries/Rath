import { getFreqRange } from "@kanaries/loa";
import type { IRawField, IRow } from "../../../../interfaces";
import type { IFieldMetaWithConfigs } from "../../../../store/causalStore/datasetStore";
import type { IteratorStorage } from "../../../../utils/iteStorage";


export const oneHot = async (data: IteratorStorage | readonly IRow[], fields: readonly IFieldMetaWithConfigs[], targets: readonly string[]) => {
    const rows = Array.isArray(data) ? data as IRow[] : await (data as IteratorStorage).getAll();
    const derivedFields: (IRawField & Required<Pick<IRawField, 'extInfo'>>)[] = [];
    const derivedTable: IRow[] = rows.map(row => ({ ...row }));
    for (const fid of targets) {
        const f = fields.find(f => f.fid === fid);
        if (!f) {
            console.warn(`Cannot find field ${fid}.`);
            continue;
        }
        const values = rows.map(row => row[fid]);
        const records = getFreqRange(values).reduce<[string | number, number][]>((list, [key, freq]) => {
            const idx = list.findIndex(which => which[0] === key);
            if (idx !== -1) {
                list[idx][1] += freq;
            } else {
                list.push([key, freq]);
            }
            return list;
        }, []).sort((a, b) => b[1] - a[1]);

        const others = `${fid}::others`;

        const MAX_CHILDREN = f.extra.oneHotK;

        const topK = records.slice(0, records.length <= MAX_CHILDREN ? undefined : MAX_CHILDREN - 1);

        for (const [key] of topK) {
            const name = `${key}`.replace(/[\s,.]+/g, '_');
            const _fid = `${fid}::${name}`;
            derivedFields.push({
                fid: _fid,
                name: `${f.name || f.fid}::${name}`,
                semanticType: 'nominal',
                analyticType: 'dimension',
                extInfo: {
                    extFrom: [fid],
                    extOpt: 'Non-standard OneHot service',
                    extInfo: {},
                },
                geoRole: 'none',
            });
            for (let i = 0; i < derivedTable.length; i += 1) {
                const flag = derivedTable[i][f.fid] === key ? 1 : 0;
                derivedTable[i][_fid] = flag;
                derivedTable[i][others] = (derivedTable[i][others] ?? 1) & (1 ^ flag);
            }
        }
        
        if (topK.length < records.length) {
            derivedFields.push({
                fid: others,
                name: `${f.name || f.fid}::[others]`,
                semanticType: 'nominal',
                analyticType: 'dimension',
                extInfo: {
                    extFrom: [fid],
                    extOpt: 'Non-standard OneHot service',
                    extInfo: {
                        excluded: records.slice(0, MAX_CHILDREN).map(([key]) => key),
                        unique: records.length - MAX_CHILDREN,
                    },
                },
                geoRole: 'none',
            });
        }
    }
    
    return [derivedFields, derivedTable] as const;
};
