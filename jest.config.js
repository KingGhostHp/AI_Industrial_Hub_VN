module.exports = {
  testEnvironment: 'node',
  testMatch: ['**/*.test.js'],
  collectCoverageFrom: [
    'src/**/*.js',
    '!src/**/*.test.js',
    '!src/**/test-*.js'
  ],
  verbose: true,
  transform: {
    '^.+\\.js$': ['babel-jest', { configFile: './babel.config.js' }]
  }
};
