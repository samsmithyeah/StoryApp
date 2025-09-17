const { FlatCompat } = require("@eslint/eslintrc");
const js = require("@eslint/js");
const typescriptEslint = require("@typescript-eslint/eslint-plugin");
const typescriptParser = require("@typescript-eslint/parser");
const reactNative = require("eslint-plugin-react-native");
const reactHooks = require("eslint-plugin-react-hooks");

const compat = new FlatCompat({
  baseDirectory: __dirname,
  recommendedConfig: js.configs.recommended,
});

module.exports = [
  // Extend Expo's ESLint configuration (provides React, React Native, and accessibility rules)
  ...compat.extends("expo"),
  {
    // Ignore Firebase Functions directory - it has its own linting setup
    // Also ignore coverage directory and other generated files
    ignores: ["functions/**/*", "coverage/**/*", "node_modules/**/*"],
  },
  {
    // ESLint config file itself
    files: ["eslint.config.js"],
    languageOptions: {
      globals: {
        __dirname: "readonly",
        module: "readonly",
        require: "readonly",
      },
    },
  },
  {
    // Jest setup files
    files: ["jest.setup.js", "**/*.test.js", "**/*.test.ts", "**/*.test.tsx"],
    languageOptions: {
      globals: {
        jest: "readonly",
        global: "writable",
        __DEV__: "readonly",
      },
    },
  },
  {
    // Node.js environment for functions
    files: ["functions/**/*.js"],
    languageOptions: {
      globals: {
        Buffer: "readonly",
        setTimeout: "readonly",
        clearTimeout: "readonly",
        setInterval: "readonly",
        clearInterval: "readonly",
        process: "readonly",
        console: "readonly",
        require: "readonly",
        module: "readonly",
        exports: "readonly",
        __dirname: "readonly",
        __filename: "readonly",
      },
    },
  },
  {
    files: ["**/*.ts", "**/*.tsx"],
    languageOptions: {
      parser: typescriptParser,
    },
    plugins: {
      "@typescript-eslint": typescriptEslint,
      "react-native": reactNative,
      "react-hooks": reactHooks,
    },
    rules: {
      // TypeScript unused vars (catches unused imports too)
      "@typescript-eslint/no-unused-vars": [
        "error",
        {
          vars: "all",
          varsIgnorePattern: "^_",
          args: "after-used",
          argsIgnorePattern: "^_",
          destructuredArrayIgnorePattern: "^_",
          ignoreRestSiblings: true,
          caughtErrors: "none",
        },
      ],
      // Disable base rule in favor of TypeScript rule
      "no-unused-vars": "off",
      // React Hooks rules
      "react-hooks/rules-of-hooks": "error",
      "react-hooks/exhaustive-deps": "warn",
      // React Native specific rules
      "react-native/no-unused-styles": "warn",
    },
  },
];
