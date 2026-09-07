module.exports = {
  testEnvironment: 'node',
  testMatch: ['**/tests/**/*.test.js'],
  collectCoverageFrom: ['src/**/*.js', '!src/seed.js'],
  coverageDirectory: 'coverage',
  verbose: true,
  testTimeout: 30000,
  setupFiles: ['<rootDir>/tests/setup.js'],
};
