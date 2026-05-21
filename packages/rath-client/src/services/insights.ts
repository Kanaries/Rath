import { IFieldMeta, IRow } from "../interfaces";
import { Aggregator } from "../global";
import { getTestServerAPI } from "./base";
import { notify } from "../components/error";

export interface IGetInsightExplProps {
    requestId: React.MutableRefObject<number>,
    dataSource: IRow[],
    fields: (IFieldMeta|undefined)[],
    aggrType: Aggregator,
    langType: string,
    setExplainLoading: (value: React.SetStateAction<boolean>) => void,
    resolveInsight: (data: React.SetStateAction<any[]>) => void
}
export async function getInsightExpl (props: IGetInsightExplProps) {
    const { requestId, dataSource, fields, aggrType, langType, setExplainLoading, resolveInsight } = props
    setExplainLoading(true)
    requestId.current++;
    let rid = requestId.current;
    let cleanedFields = fields.filter(v => v !== undefined) as IFieldMeta[];
    fetch(getTestServerAPI('insight'), {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            dataSource: dataSource.map(row => {
                let res: IRow = {};
                for (let f of cleanedFields) {
                    res[f.fid] = row[f.fid]
                }
                return res;
            }),
            fields: cleanedFields,
            aggrType: aggrType,
            langType: langType
        })
    })
    .then(async (res) => {
        const text = await res.text();
        let json: any;
        try {
            json = JSON.parse(text);
        } catch {
            throw new Error(`Narrative service returned non-JSON (${res.status}): ${text.slice(0, 200)}`);
        }
        if (!res.ok) {
            throw new Error(json?.message ?? `Narrative service error (${res.status})`);
        }
        return json;
    })
    .then(res => {
        if (res.success) {
            rid === requestId.current && resolveInsight(res.data)
        } else {
            throw new Error(res.message)
        }
    }).catch(err => {
        console.error(err);
        notify({
            type: 'error',
            title: 'Narrative service error',
            content: err instanceof Error ? err.message : String(err),
        });
        resolveInsight([])
    }).finally(() => {
        setExplainLoading(false)
    })
}