module.exports = {
  preset: "jest-expo",
  testEnvironment: "node",
  transformIgnorePatterns: [
    "node_modules/(?!((jest-)?react-native|@react-native(-community)?)|expo(nent)?|@expo(nent)?/.*|@expo-google-fonts/.*|react-navigation|@react-navigation/.*|@sentry/react-native|native-base|react-native-svg|react-native-reanimated|@react-native-firebase/.*|@react-native-google-signin/.*|zustand)",
  ],
  setupFilesAfterEnv: ["<rootDir>/jest.setup.js"],
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/$1",
  },
  testMatch: [
    "**/__tests__/**/*.(ts|tsx|js)",
    "**/?(*.)+(spec|test).(ts|tsx|js)",
  ],
  collectCoverageFrom: [
    "**/*.{ts,tsx}",
    "!**/node_modules/**",
    "!**/vendor/**",
    "!**/coverage/**",
    "!**/*.d.ts",
    "!**/functions/**",
    "!**/android/**",
    "!**/ios/**",
  ],
  coverageThreshold: {
    global: {
      branches: 50,
      functions: 50,
      lines: 50,
      statements: 50,
    },
  },
  moduleFileExtensions: ["ts", "tsx", "js", "jsx", "json"],
  globals: {
    __DEV__: false,
  },
};
