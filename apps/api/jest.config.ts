import type { Config } from 'jest';

const config: Config = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src'],
  testMatch: ['**/__tests__/**/*.test.ts'],
  moduleNameMapper: {
    // Mirror the tsconfig path aliases so imports resolve in tests
    '@biopropose/shared-types': '<rootDir>/../../packages/shared-types/src/index.ts',
    '@biopropose/database':     '<rootDir>/../../packages/database/src/index.ts',
  },
  // Don't boot the real database for unit tests
  setupFilesAfterEach: [],
  clearMocks: true,
  coverageDirectory: 'coverage',
  collectCoverageFrom: [
    'src/services/**/*.ts',
    'src/utils/**/*.ts',
    '!src/**/*.d.ts',
  ],
};

export default config;
