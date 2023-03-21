const webpack = require('webpack');
const MonacoWebpackPlugin = require('monaco-editor-webpack-plugin');
// const path = require('path');
// const { override, babelInclude } = require('customize-cra')

// const mid_override = override(
//   babelInclude([
//     path.resolve('src'),
//     path.resolve(__dirname, '../../node_modules/visual-insights')
//   ])
// )

module.exports = function override(config, env) {
    config.plugins.push(
        new webpack.ProvidePlugin({
            Buffer: ['buffer', 'Buffer'],
        }),
        new MonacoWebpackPlugin({
            // available options are documented at https://github.com/microsoft/monaco-editor/blob/main/webpack-plugin/README.md#options
            languages: ['json', 'sql']
        })
    );
    // do stuff with the webpack config...
    config.module.rules.push(
        {
            test: /.*\/src\/.*\.worker\.js$/,
            use: {
                loader: 'worker-loader',
                options: {
                    inline: 'fallback',
                    filename: '[contenthash].worker.js',
                },
            },
        },
        {
            test: /.*\/src\/.*\.worker\.ts$/,
            use: [
                {
                    loader: 'worker-loader',
                    options: {
                        inline: 'fallback',
                        filename: '[contenthash].worker.js',
                    },
                },
                'ts-loader',
            ],
        }
    );
    // allow config.stats when you want to see the details log in console of webpack
    // config.stats = {
    //     children: true,
    // };
    if (config.resolve) {
        let fallback = {};
        if (config.resolve.fallback) {
            fallback = { ...config.resolve.fallback };
        }
        fallback.buffer = require.resolve('buffer/');
        config.resolve = {
            ...config.resolve,
            fallback,
        };
    } else {
        config.resolve = {
            fallback: {
                buffer: require.resolve('buffer/'),
            },
        };
    }
    config.resolve.extensions.push('.ts', '.tsx', 'js');
      config.resolve.fallback = {
        buffer: require.resolve('buffer')
      }
    config.output.globalObject = 'self';
    // config.module = config.module || {};
    // config.module.unknownContextCritical = false
    return config;
    // return mid_override(config)
};
