/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  transform: {
    '^.+\\.tsx?$': 'ts-jest',
  },
  moduleNameMapper: {
    '^runtime-env$': '<rootDir>/test-stubs/runtime-env.ts',
    '^utils/(.*)$': '<rootDir>/src/utils/$1',
  },
};
