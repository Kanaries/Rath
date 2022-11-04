/* eslint no-restricted-globals: 0 */
import { timer } from '../../workers/timer';
import { checkRelationMatrix } from "./utils";


const inferService = e => {
    try {
        const { fields, dataSource, matrix } = e.data;
        const res = checkRelationMatrix(matrix, fields, dataSource);
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