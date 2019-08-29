export default {
  input: 'lib/index.js',
  output: [{
      file: 'lib/build/bundle.js',
      format: 'cjs'
    },
    {
      file: 'src/build/bundle.js',
      format: 'esm'
    }
  ]
};