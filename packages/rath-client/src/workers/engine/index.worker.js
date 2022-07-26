/* eslint no-restricted-globals: 0 */

import { router } from './service';

function main (e) {
    router(e, (res) => {
        self.postMessage({
            success: true,
            data: res
        })
    }, (message) => {
        self.postMessage({
            success: false,
            message: `[worker]${message}`
        })
    }).catch(err => {
        self.postMessage({
            success: false,
            message: `[worker]${err}\n${err.stack}`
        })
    })
}

self.addEventListener('message', main, false);