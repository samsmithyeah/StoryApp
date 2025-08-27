const { FlatCompat } = require("@eslint/eslintrc");
const js = require("@eslint/js");
const typescriptEslint = require("@typescript-eslint/eslint-plugin");
const typescriptParser = require("@typescript-eslint/parser");

const compat = new FlatCompat({
  baseDirectory: __dirname,
  recommendedConfig: js.configs.recommended,
});

module.exports = [
  ...compat.extends("expo"),
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
    },
  },
];
