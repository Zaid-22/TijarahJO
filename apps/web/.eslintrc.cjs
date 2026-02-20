module.exports = {
  root: true,
  env: {
    browser: true,
    es2022: true,
    node: true,
  },
  parser: "@typescript-eslint/parser",
  parserOptions: {
    ecmaVersion: "latest",
    sourceType: "module",
    // Suppress version-range warning when local TypeScript is newer than parser's tested range.
    warnOnUnsupportedTypeScriptVersion: false,
    ecmaFeatures: {
      jsx: true,
    },
  },
  plugins: ["@typescript-eslint", "react-hooks", "react-refresh"],
  extends: [
    "eslint:recommended",
    "plugin:@typescript-eslint/recommended",
    "plugin:react-hooks/recommended",
  ],
  ignorePatterns: ["dist", "node_modules"],
  rules: {
    "@typescript-eslint/no-explicit-any": "off",
    "@typescript-eslint/no-unused-vars": [
      "error",
      { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
    ],
    "no-console": "error",
    "no-alert": "error",
    "no-restricted-properties": [
      "error",
      {
        object: "window",
        property: "confirm",
        message:
          "Use the shared ConfirmActionDialog instead of window.confirm.",
      },
      {
        object: "window",
        property: "alert",
        message:
          "Use the shared toast/dialog primitives instead of window.alert.",
      },
    ],
    "max-lines": [
      "error",
      { max: 450, skipBlankLines: true, skipComments: true },
    ],
    "react-refresh/only-export-components": "off",
  },
  overrides: [
    {
      files: ["src/shared/lib/logger.ts"],
      rules: {
        "no-console": "off",
      },
    },
  ],
};
