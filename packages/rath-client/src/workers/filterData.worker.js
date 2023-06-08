/* eslint no-restricted-globals: 0 */

import { IteratorStorage } from '../utils/iteStorage'
import { applyFilters } from './engine/filter';
import { timer } from './timer';

const filterService = (e) => {
    try {
        const { dataSource, dataStorage, computationMode, extData, filters, resultStorage, fields } = e.data;

        if (computationMode === 'inline') {
            const res = applyFilters(dataSource, fields, extData, filters);
            self.postMessage({
                success: true,
                data: {
                    rows: res,
                    versionCode: 0
                },
            });
        } else if (computationMode === 'offline') {
            const storage = new IteratorStorage(dataStorage)
            const resSto = new IteratorStorage(resultStorage)
            storage.getAll().then(data => {
                return applyFilters(data, fields, extData, filters);
            }).then(data => {
                return resSto.setAll(data);
            }).then(() => {
                self.postMessage({
                    success: true,
                    data: {
                        rows: [],
                        versionCode: resSto.versionCode
                    },
                });
            })
            .catch(err => {
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
