/* eslint no-restricted-globals: 0 */

import {  applyFiltersAsIndices } from './engine/filter';
import { timer } from './timer';

const filterService = (e) => {
    try {
        const { dataSource, extData, filters } = e.data;
        const res = applyFiltersAsIndices(dataSource, extData, filters);
        self.postMessage({
            success: true,
            data: res,
        });
    } catch (error) {
        self.postMessage({
            success: false,
            message: `[filter data]${error}\n${error.stack}`,
        });
    }
};

self.addEventListener('message', timer(filterService), false);
