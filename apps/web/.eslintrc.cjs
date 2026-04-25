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
  plugins: ["@typescript-eslint", "react-hooks", "react-refresh", "jsx-a11y"],
  extends: [
    "eslint:recommended",
    "plugin:@typescript-eslint/recommended",
    "plugin:react-hooks/recommended",
    "plugin:jsx-a11y/recommended",
  ],
  ignorePatterns: ["dist", "node_modules"],
  rules: {
    "@typescript-eslint/no-explicit-any": "error",
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
    "jsx-a11y/control-has-associated-label": "error",
    "jsx-a11y/no-static-element-interactions": "error",
    "jsx-a11y/click-events-have-key-events": "error",
    "jsx-a11y/interactive-supports-focus": "error",
    "react-refresh/only-export-components": "off",
  },
  overrides: [
    {
      files: ["src/shared/lib/logger.ts"],
      rules: {
        "no-console": "off",
      },
    },
    {
      files: ["**/*.cjs"],
      rules: {
        "@typescript-eslint/no-var-requires": "off",
        "@typescript-eslint/no-require-imports": "off",
      },
    },
  ],
};
