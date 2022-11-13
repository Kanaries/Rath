/* eslint no-restricted-globals: 0 */

import { IteratorStorage } from '../utils/iteStorage'
import { applyFilters } from './engine/filter';
import { timer } from './timer';

const filterService = (e) => {
    try {
        const { dataSource, dataStorage, dataStorageType, extData, filters } = e.data;

        if (dataStorageType === 'memory') {
            const res = applyFilters(dataSource, extData, filters);
            self.postMessage({
                success: true,
                data: res,
            });
        } else if (dataStorageType === 'db') {
            const storage = new IteratorStorage(dataStorage)
            storage.getAll().then(data => {
                const res = applyFilters(data, extData, filters);
                self.postMessage({
                    success: true,
                    data: res,
                });
            }).catch(err => {
                self.postMessage({
                    success: false,
                    error: `[filter data]${err}\n${err.stack}`,
                });
            })
        }
    } catch (error) {
        self.postMessage({
            success: false,
            message: `[filter data]${error}\n${error.stack}`,
        });
    }
};

self.addEventListener('message', timer(filterService), false);
