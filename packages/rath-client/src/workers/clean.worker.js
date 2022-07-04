/* eslint no-restricted-globals: 0 */
import { cleanAndTransformData } from "./engine/cleaner";
import { timer } from './timer';


const cleanService = e => {
    try {
        const { dataSource, method, fields } = e.data;
        
        const res = cleanAndTransformData(dataSource, fields, method)
        self.postMessage({
            success: true,
            data: res
        })
    } catch (error) {
        self.postMessage({
            success: false,
            message: `[clean data]${error}\n${error.stack}`
        })
    }
}

self.addEventListener('message', timer(cleanService), false)