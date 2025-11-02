// jest.config.js
const nextJest = require("next/jest");

const createJestConfig = nextJest({
  // Provide the path to your Next.js app to load next.config.js and .env files
  dir: "./",
});

// Add any custom config to be passed to Jest
const customJestConfig = {
  // Use ts-jest for .ts files
  preset: "ts-jest",
  // Use the node environment
  testEnvironment: "node",
  // Look for test files in the entire project
  roots: ["<rootDir>"],
  // A path to a module that runs code before all tests
  // We will create this file next
  setupFilesAfterEnv: ["<rootDir>/__tests__/setup.ts"],
  // Module aliases (to match your tsconfig.json)
  moduleNameMapper: {
    "^@/lib/(.*)$": "<rootDir>/lib/$1",
    "^@/app/(.*)$": "<rootDir>/app/$1",
    // Add any other aliases you have
  },
  // Ignore node_modules, .next
  testPathIgnorePatterns: ["<rootDir>/node_modules/", "<rootDir>/.next/"],
};

// createJestConfig is exported this way to ensure that next/jest can load the Next.js config which is async
module.exports = createJestConfig(customJestConfig);