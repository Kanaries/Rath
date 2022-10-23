import { IFieldMeta, IRow } from "../interfaces";
import { Aggregator } from "../global";
import { getTestServerAPI } from "./base";

export interface IGetInsightExplProps {
    requestId: React.MutableRefObject<number>,
    dataSource: IRow[],
    fields: IFieldMeta[],
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
    fetch(getTestServerAPI('insight'), {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            dataSource: dataSource,
            fields: fields,
            aggrType: aggrType,
            langType: langType
        })
    })
    .then(res => res.json())
    .then(res => {
        if (res.success) {
            rid === requestId.current && resolveInsight(res.data)
        } else {
            throw new Error(res.message)
        }
    }).catch(err => {
        console.error(err);
        resolveInsight([])
    }).finally(() => {
        setExplainLoading(false)
    })
}