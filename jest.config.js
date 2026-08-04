/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
  preset: "ts-jest",
  testEnvironment: "node",
  roots: ["<rootDir>/lib", "<rootDir>/components", "<rootDir>/app"],
  testMatch: ["**/__tests__/**/*.test.ts", "**/__tests__/**/*.test.tsx"],
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/$1",
  },
  setupFilesAfterEnv: ["<rootDir>/jest.setup.js"],
  collectCoverageFrom: [
    "lib/domain/**/*.ts",
    "lib/application/**/*.ts",
    "lib/infrastructure/**/*.ts",
    "!lib/domain/**/__tests__/**",
    "!lib/application/**/__tests__/**",
    "!lib/infrastructure/**/__tests__/**",
    "!lib/domain/**/index.ts",
    "!lib/infrastructure/**/index.ts",
  ],
  coverageThreshold: {
    global: {
      branches: 50,
      functions: 65,
      lines: 75,
      statements: 75,
    },
  },
};
