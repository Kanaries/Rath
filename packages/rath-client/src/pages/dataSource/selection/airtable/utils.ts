// interface 
import Airtable from "airtable";
import { AirtableBase } from "airtable/lib/airtable_base";
import { IRow } from "visual-insights";

interface IAirtableAPIBase {
    tableName: string;
    viewName: string;
    endPoint: string;
    apiKey: string;
    tableID: string;
}

function selectAllPromise (base: AirtableBase, tableName: string, viewName: string) {
    return new Promise<IRow[]>((resolve, reject) => {
        const rows: IRow[] = []
        base(tableName).select({
            view: viewName
        }).eachPage((records, fetchNextPage) => {
            for (let rec of records) {
                rows.push({ ...rec.fields })
            }
            fetchNextPage()
        }, (err) => {
            if (err) { reject(err); return; }
            resolve(rows)
        })
    })
}
export async function fetchAllRecordsFromAirTable (props: IAirtableAPIBase): Promise<IRow[]> {
    const at = new Airtable({
        endpointUrl: props.endPoint,
        apiKey: props.apiKey,
    })
    const base = at.base(props.tableID)
    const res = await selectAllPromise(base, props.tableName, props.viewName);
    return res;
}