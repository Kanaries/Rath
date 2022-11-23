/* eslint no-restricted-globals: 0 */
import { IteratorStorage } from "../utils/iteStorage";
import { cleanAndTransformData } from "./engine/cleaner";
import { timer } from './timer';


const cleanService = e => {
    try {
        const { dataSource, method, fields, computationMode, storage } = e.data;
        if (computationMode === 'inline') {
            const res = cleanAndTransformData(dataSource, fields, method)
            self.postMessage({
                success: true,
                data: res
            })
        } else {
            const sto = new IteratorStorage(storage)
            sto.getAll().then(data => {
                return cleanAndTransformData(data, fields, method)
            }).then(data => {
                self.postMessage({
                    success: true,
                    data
                })
            }).catch(err => {
                self.postMessage({
                    success: false,
                    error: `[clean data]${err}\n${err.stack}`
                })
            })
        }
    } catch (error) {
        self.postMessage({
            success: false,
            message: `[clean data]${error}\n${error.stack}`
        })
    }
}

self.addEventListener('message', timer(cleanService), false)