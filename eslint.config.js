import js from "@eslint/js";
import globals from "globals";
import { defineConfig, globalIgnores } from "eslint/config";

export default defineConfig([
  globalIgnores([
    "node_modules",
    "src/generated",
    "prisma/migrations",
    "coverage",
  ]),

  {
    files: ["**/*.js"],

    extends: [js.configs.recommended],

    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
      globals: { ...globals.node },
    },

    rules: {
      "no-unused-vars": [
        "error",
        {
          // Express error-handling middleware must keep the `next` param
          // (arity is how Express recognizes it), even when unused.
          argsIgnorePattern: "^_|^next$",
          varsIgnorePattern: "^_",
        },
      ],
    },
  },
]);
