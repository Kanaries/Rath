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
import { IDatasetBase, IRow } from "../../../../interfaces"
import { rawData2DataWithBaseMetas } from "../../utils"

export type IJSONAPIFormat = 'array' | 'array_with_meta' | 'others'
export function jsonDataFormatChecker (parsedData: any): IJSONAPIFormat {
    if (parsedData instanceof Array) {
        return 'array'
    }
    if (parsedData.dataSource instanceof Array && parsedData.fields instanceof Array) {
        return 'array_with_meta'
    }
    return 'others'
}

export function getPreviewData (parsedData: any, format: IJSONAPIFormat): any {
    try {
        if (format === 'array') {
            return parsedData.slice(0, 10)
        }
        if (format === 'array_with_meta') {
            // drop distribution key in each field in fields
            return {
                fields: parsedData.fields.map((field: any) => {
                    const { distribution, ...rest } = field
                    return rest
                }),
                dataSource: parsedData.dataSource.slice(0, 10)
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
        if (format === 'array') {
            const res = await rawData2DataWithBaseMetas(parsedData as IRow[])
            return res;
        }
        if (format === 'array_with_meta') {
            // drop distribution key in each field in fields
            return {
                fields: parsedData.fields.map((field: any) => {
                    const { distribution, ...rest } = field
                    return rest
                }),
                dataSource: parsedData.dataSource
            }
        } else {
            throw new Error("not supportted format")
        }
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