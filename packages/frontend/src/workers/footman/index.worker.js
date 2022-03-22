/* eslint no-restricted-globals: 0 */

import { serviceHandler } from './service';

function main (e) {
    try {
        const res = serviceHandler(e.data);
        self.postMessage({
            success: true,
            data: res
        })
    } catch (error) {
        self.postMessage({
            success: false,
            message: `[worker]${error}`
        })        
    }
}

self.addEventListener('message', main, false);