/* eslint no-restricted-globals: 0 */
import { getFieldRelationMatrix } from '@kanaries/loa'
import { timer } from '../../workers/timer';
import { getFieldRelationCheckedMatrix } from "./utils";

const inferService = e => {
    try {
        const { fields, dataSource, matrix, task } = e.data;
        let res = [];
        if (task === 'ig') {
            res = getFieldRelationMatrix(dataSource, fields);
        } else {
            res = getFieldRelationCheckedMatrix(matrix, fields, dataSource);
        }
        self.postMessage({
            success: true,
            data: res
        })
    } catch (error) {
        self.postMessage({
            success: false,
            message: error.toString()
        })
    }
}

self.addEventListener('message', timer(inferService), false)