// https://docs.expo.dev/guides/using-eslint/
const { defineConfig } = require("eslint/config");
const expoConfig = require("eslint-config-expo/flat");

module.exports = defineConfig([
  expoConfig,
  {
    ignores: ["dist/*", ".expo/*", "node_modules/*"],
  },
  {
    rules: {
      // Guards HTML entity parsing in web JSX; React Native <Text> renders
      // apostrophes literally, so it only adds noise here.
      "react/no-unescaped-entities": "off",
    },
  },
  {
    // Feature code must import web code through src/shared.ts (the
    // allowlist checked by `npm run check:shared`).
    files: ["app/**/*.{ts,tsx}", "src/**/*.{ts,tsx}"],
    ignores: ["src/shared.ts"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: ["@web/*", "@/*", "../../src/*"],
              message: "Import web code through ~/shared (see docs/ARCHITECTURE.md §5).",
              allowTypeImports: true,
            },
          ],
        },
      ],
    },
  },
]);
