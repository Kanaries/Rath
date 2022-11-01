import axios from "axios";
import { IDBFieldMeta } from "../interfaces";
import { useGlobalStore } from "../store";
// import fs from 'fs'
export async function CHQuery (sql: string): Promise<string> {
    const config = useGlobalStore().getConfig();
    // fs.appendFileSync('./log.sql', sql)
    const res = await axios(`${config.clickhouse.protocol}://${config.clickhouse.host}:${config.clickhouse.port}?query=${sql}`, {
        params: {
            query: sql,
            user: config.clickhouse.user,
            password: config.clickhouse.password
        }
    });
    return res.data;
}

export async function getFieldMetas(viewName: string): Promise<IDBFieldMeta[]> {
    const metaRaw = await CHQuery(`DESC ${viewName}`);
    return metaRaw.slice(0, -1).split('\n').map(fr => {
        const infos = fr.split('\t');
        return {
            fid: infos[0],
            dataType: infos[1]
        }
    })
}