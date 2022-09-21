/* eslint no-restricted-globals: 0 */
/* eslint-disable */ 

/**
 * @param {import('../interfaces').IRow[]} dataSource
 * @param {import('../interfaces').IFilterField[]} filters
 * @return {import('../interfaces').IRow[]}
 */
const filter = (dataSource, filters) => {
    return dataSource.filter(which => {
        for (const { rule, fid } of filters) {
            if (!rule) {
                continue;
            }

            switch (rule.type) {
                case 'one of': {
                    if (rule.value.has(which[fid])) {
                        break;
                    } else {
                        return false;
                    }
                }
                case 'range': {
                    if (rule.value[0] <= which[fid] && which[fid] <= rule.value[1]) {
                        break;
                    } else {
                        return false;
                    }
                }
                case 'temporal range': {
                    try {
                        const time = new Date(which[fid]).getTime();

                        if (
                            rule.value[0] <= time && time <= rule.value[1]
                        ) {
                            break;
                        } else {
                            return false;
                        }
                    } catch (error) {
                        console.error(error);

                        return false;
                    }
                }
                default: {
                    console.warn('Unresolvable filter rule', rule);
                    continue;
                }
            }
        }

        return true;
    });
};

/**
 * @param {MessageEvent<{ dataSource: import('../interfaces').IRow[]; filters: import('../interfaces').IFilterField[] }>} e
 */
const main = e => {
    const { dataSource, filters } = e.data;

    const filtered = filter(dataSource, filters);

    self.postMessage(filtered);
};

self.addEventListener('message', main, false);
