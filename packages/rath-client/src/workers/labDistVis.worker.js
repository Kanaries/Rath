/* eslint no-restricted-globals: 0 */
import { labDistVis } from '../queries/labdistVis';


const labDistVisWorker = e => {
    try {
        const props = e.data;
        if ('items' in props) {
            const { dataSource } = props;
            const list = props.items.map(item => labDistVis({ ...item, dataSource }));
            self.postMessage({
                success: true,
                data: list,
            });
        } else {
            const res = labDistVis(props);
            self.postMessage({
                success: true,
                data: res
            });
        }
    } catch (error) {
        self.postMessage({
            success: false,
            message: error.toString()
        })
    }
};

self.addEventListener('message', labDistVisWorker, false);
