import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

// eslint-config-next 16 ships native flat configs (no FlatCompat shim).
export default defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    rules: {
      // console.error / console.warn are how server errors reach the host's
      // logs; console.log is debugging left behind (use lib/devLog).
      "no-console": ["warn", { allow: ["warn", "error", "info", "debug"] }],
      // New in eslint-config-next 16 (React Compiler rules). The existing
      // code predates them, so they warn rather than fail while it's moved
      // over; CI's --max-warnings stops the count from growing.
      "react-hooks/set-state-in-effect": "warn",
      "react-hooks/purity": "warn",
      "react-hooks/refs": "warn",
      "react-hooks/immutability": "warn",
      "react-hooks/static-components": "warn",
    },
  },
  {
    // Scripts and tests print on purpose.
    files: ["scripts/**", "src/__tests__/**", "**/*.test.{ts,tsx}"],
    rules: { "no-console": "off" },
  },
  globalIgnores([
    "node_modules/**",
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // React Native app: has its own toolchain in mobile/ (expo lint)
    "mobile/**",
  ]),
]);
