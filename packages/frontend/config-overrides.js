module.exports = function override(config, env) {
  // do stuff with the webpack config...
  config.module.rules.push({
    test: /\.worker\.js$/,
    use: {
      loader: 'worker-loader',
      options: {
        inline: 'fallback',
      },
    },
  })
  config.output.globalObject = 'self'
  return config;
};