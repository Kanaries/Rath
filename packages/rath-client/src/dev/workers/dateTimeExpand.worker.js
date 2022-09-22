import { timer } from '../../workers/timer';
/* eslint no-restricted-globals: 0 */
import { dateTimeExpand } from "./engine/dateTimeExpand";

const expandService = e => {
    try {
        const { fields, dataSource } = e.data;
        const res = dateTimeExpand({ fields, dataSource })
        self.postMessage({
            success: true,
            data: res
        })
    } catch (error) {
        self.postMessage({
            success: false,
            message: `[expandService]${error}\n${error.stack}`
        })
    }
}

self.addEventListener('message', timer(expandService), false)