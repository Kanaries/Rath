const webpack = require('webpack');

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
    );
    // do stuff with the webpack config...
    config.module.rules.push(
        {
            test: /\.worker\.js$/,
            use: {
                loader: 'worker-loader',
                options: {
                    inline: 'fallback',
                    filename: '[contenthash].worker.js',
                },
            },
        },
        {
            test: /\.worker\.ts$/,
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
    config.stats = {
        children: true,
    };
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
