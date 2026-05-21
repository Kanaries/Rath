// Copyright (C) 2023 observedobserver
// 
// This program is free software: you can redistribute it and/or modify
// it under the terms of the GNU Affero General Public License as
// published by the Free Software Foundation, either version 3 of the
// License, or (at your option) any later version.
// 
// This program is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
// GNU Affero General Public License for more details.
// 
// You should have received a copy of the GNU Affero General Public License
// along with this program.  If not, see <http://www.gnu.org/licenses/>.

import { DEMO_DATA_REQUEST_TIMEOUT } from "../../../../constants"
import { IDatasetBase } from "../../../../interfaces"
import {
    extractRecords,
    jsonDataFormatChecker,
    type IJSONAPIFormat,
} from "../../../../utils/structuredDataParser"
import { rawData2DataWithBaseMetas } from "../../utils"

export type { IJSONAPIFormat } from "../../../../utils/structuredDataParser"
export { jsonDataFormatChecker }

export function getPreviewData (parsedData: any, format: IJSONAPIFormat): any {
    try {
        if (format === 'array') {
            const { rows } = extractRecords(parsedData);
            return rows.slice(0, 10)
        }
        if (format === 'array_with_meta') {
            const { fields, rows } = extractRecords(parsedData);
            return {
                fields,
                dataSource: rows.slice(0, 10)
            }
        }
    } catch (error) {
        return {
            fields: [],
            dataSource: [],
            error: 'Error in parsing data.'
        }
    }
    return parsedData
}

export async function getFullData (parsedData: any, format: IJSONAPIFormat): Promise<IDatasetBase> {
    try {
        if (format === 'array' || format === 'array_with_meta') {
            const extracted = extractRecords(parsedData);
            if (extracted.format === 'array_with_meta' && extracted.fields) {
                return {
                    fields: extracted.fields,
                    dataSource: extracted.rows,
                };
            }
            return await rawData2DataWithBaseMetas(extracted.rows);
        }
        throw new Error("not supportted format")
    } catch (error) {
        return {
            fields: [],
            dataSource: [],
            error: 'Error in parsing data.'
        }
    }
}

export function requestJSONAPIData (api: string): Promise<any> {
    return new Promise<any>((resolve, reject) => {
        let isTimeout = false;
        setTimeout(() => {
            isTimeout = true;
        }, DEMO_DATA_REQUEST_TIMEOUT)
        fetch(api).then(res => res.json())
            .then(res => {
                if (!isTimeout) {
                    resolve(res)
                } else {
                    reject('API Data Request Timeout.')
                }
            })
            .catch(err => reject(err));
    })
}
