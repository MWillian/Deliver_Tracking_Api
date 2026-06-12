export default {
  testEnvironment: 'node',
  
  setupFilesAfterEnv: ['./tests/setup.js'],
  
  testMatch: [
    '<rootDir>/tests/unit/**/*.test.js',
    '<rootDir>/tests/integration/**/*.test.js'
  ],

  coverageThreshold: {
    './src/services/': { statements: 80 },
    './src/middlewares/': { statements: 85 },
    './src/utils/': { statements: 75 }
  },

  collectCoverageFrom: [
    'src/**/*.js',
    '!src/config/**',
    '!src/server.js'
  ]
};