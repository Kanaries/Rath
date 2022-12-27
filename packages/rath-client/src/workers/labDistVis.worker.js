/* eslint no-restricted-globals: 0 */
import { labDistVis } from '../queries/labdistVis';


const labDistVisWorker = e => {
    try {
        const props = e.data;
        const res = labDistVis(props);
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
};

self.addEventListener('message', labDistVisWorker, false);
