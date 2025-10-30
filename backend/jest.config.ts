export default {
  preset: "ts-jest",
  testEnvironment: "node",
  verbose: true,
  clearMocks: true,
  coverageDirectory: "coverage",
  collectCoverage: true,
  collectCoverageFrom: [
    "src/**/*.ts",
    "!src/**/index.ts",
    "!src/config/**",
    "!src/types/**",
    "!src/constants/**",
  ],
  coverageReporters: ["json", "lcov", "text", "clover"],
  testMatch: ["**/__tests__/**/*.test.ts", "**/?(*.)+(spec|test).ts"],
  testTimeout: 10000,
  globals: {
    "ts-jest": {
      tsconfig: {
        types: ["jest", "node"],
      },
    },
  },
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/src/$1",
    "^@config/(.*)$": "<rootDir>/src/config/$1",
    "^@utils/(.*)$": "<rootDir>/src/utils/$1",
    "^@models/(.*)$": "<rootDir>/src/models/$1",
    "^@services/(.*)$": "<rootDir>/src/services/$1",
    "^@controllers/(.*)$": "<rootDir>/src/controllers/$1",
    "^@middleware/(.*)$": "<rootDir>/src/middleware/$1",
    "^@routes/(.*)$": "<rootDir>/src/routes/$1",
    "^@types/(.*)$": "<rootDir>/src/types/$1",
    "^@constants/(.*)$": "<rootDir>/src/constants/$1",
  },
  setupFilesAfterEnv: ["<rootDir>/jest.setup.ts"],
};
