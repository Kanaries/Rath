module.exports = {
  preset: 'ts-jest',
  globals: {
    'ts-jest': {
      diagnostics: false,
      tsConfig: 'tsconfig.cjs.json'
    },
  },
  browser: false,
  testPathIgnorePatterns: ['/node_modules/', 'test/', 'build/'],
  collectCoverage: false,
  collectCoverageFrom: ['src/**/*.ts'],
}
