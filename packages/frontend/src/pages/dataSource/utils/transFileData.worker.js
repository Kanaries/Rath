/* eslint no-restricted-globals: 0 */
import { transFileData } from './tools'

function handler (e) {
    const rawData = e.data;
    try {
        const dataset = transFileData(rawData);
        self.postMessage({
            success: true,
            data: dataset
        })
    } catch (error) {
        self.postMessage({
            success: false,
            message: `${error.toString()}\n${error.stack}`
        })
    }
}

self.addEventListener('message', handler, false)