import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  {
    rules: {
      // AWS-specific rules
      "no-console": ["warn", { allow: ["warn", "error"] }],
      "prefer-const": "error",
      "no-var": "error",
      "no-unused-vars": ["error", { argsIgnorePattern: "^_" }],
      
      // Security rules
      "no-eval": "error",
      "no-implied-eval": "error",
      "no-new-func": "error",
      
      // Performance rules
      "prefer-template": "error",
      "object-shorthand": "error",
      
      // TypeScript specific
      "@typescript-eslint/no-unused-vars": ["error", { argsIgnorePattern: "^_" }],
      "@typescript-eslint/no-explicit-any": "warn",
      
      // React specific
      "react-hooks/rules-of-hooks": "error",
      "react-hooks/exhaustive-deps": "warn",
      "react/jsx-key": "error",
      "react/jsx-no-duplicate-props": "error",
      
      // Next.js specific
      "@next/next/no-img-element": "warn",
      "@next/next/no-html-link-for-pages": "error",
    },
    ignores: [
      ".next/**/*",
      "out/**/*", 
      "build/**/*",
      "dist/**/*",
      "node_modules/**/*",
      ".next/**",
      ".turbo/**",
      "coverage/**",
      "*.d.ts",
      "infrastructure/cdk.out/**/*",
      "lambda/**/node_modules/**/*"
    ]
  }
];

export default eslintConfig;
