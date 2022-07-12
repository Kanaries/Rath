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
  })
  config.output.globalObject = 'self'
  return config;
};