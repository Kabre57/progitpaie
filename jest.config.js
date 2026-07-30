/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
  preset: "ts-jest",
  testEnvironment: "node",
  roots: ["<rootDir>/lib/domain", "<rootDir>/lib/infrastructure"],
  testMatch: ["**/__tests__/**/*.test.ts"],
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/$1",
  },
  collectCoverageFrom: [
    "lib/domain/**/*.ts",
    "lib/infrastructure/**/*.ts",
    "!lib/domain/**/__tests__/**",
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
