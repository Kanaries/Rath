// const path = require('path');
// const { override, babelInclude } = require('customize-cra')

// const mid_override = override(
//   babelInclude([
//     path.resolve('src'),
//     path.resolve(__dirname, '../../node_modules/visual-insights')
//   ])
// )

module.exports = function override(config, env) {
  // do stuff with the webpack config...
  config.module.rules.push({
    test: /\.worker\.js$/,
    use: {
      loader: 'worker-loader',
      options: {
        inline: 'fallback',
        filename: '[contenthash].worker.js'
      },
    },
  }, {
    test: /\.worker\.ts$/,
    use: [{
      loader: 'worker-loader',
      options: {
        inline: 'fallback',
        filename: '[contenthash].worker.js'
      },
    }, 'ts-loader'],
  })
  config.output.globalObject = 'self'
  // config.module = config.module || {};
  // config.module.unknownContextCritical = false
  return config
  // return mid_override(config)
};