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
    })
}

self.addEventListener('message', main, false);