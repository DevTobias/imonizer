module.exports = {
  parser: "@typescript-eslint/parser",
  parserOptions: {
    sourceType: "module",
    ecmaVersion: 2020,
    project: "./tsconfig.json",
  },
  extends: [
    "airbnb-base",
    "airbnb-typescript/base",
    "eslint:recommended",
    "plugin:@typescript-eslint/eslint-recommended",
    "plugin:@typescript-eslint/recommended",
    "plugin:@typescript-eslint/recommended-requiring-type-checking",
    "plugin:eslint-comments/recommended",
    "plugin:import/recommended",
    "plugin:import/typescript",
    "plugin:prettier/recommended",
    "prettier",
  ],
  plugins: ["@typescript-eslint", "import", "eslint-plugin-tsdoc"],
  settings: {
    "import/resolver": {
      node: {
        extensions: [".js", ".ts", ".json"],
      },
      typescript: {},
    },
    "import/extensions": [".js", ".ts"],
  },
  rules: {
    "import/prefer-default-export": "off",
    "no-console": "off",
  },
  ignorePatterns: ["*.mjs", "*.cjs", "**/*.js", "*.d.ts"],
  env: {
    browser: true,
    es2020: true,
    node: true,
  },
};
