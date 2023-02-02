const path = require('path');
const { paths, baseUrl } = require('./tsconfig.json').compilerOptions;

/**
 * @param {import('webpack').Configuration} config
 * @returns {import('webpack').Configuration}
 */
module.exports = function override(config, env) {
    const alias = config.resolve.alias ?? {};
    for (const [k, values] of Object.entries(paths)) {
        alias[k.replace(/\/\*$/, '')] = path.resolve(baseUrl, values[0].replace(/(\*|(\/\*))+$/, ''));
    }
    config.resolve.alias = alias;
    // config.externals = ['react', 'react-dom', 'styled-components'];

    return config;
};
