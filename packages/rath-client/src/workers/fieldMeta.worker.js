/* eslint no-restricted-globals: 0 */
import { computeFieldMeta } from "../lib/meta/fieldMeta";
import { timer } from './timer';


const inferService = e => {
    try {
        const { fields, dataSource } = e.data;
        const res = computeFieldMeta(dataSource, fields)
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