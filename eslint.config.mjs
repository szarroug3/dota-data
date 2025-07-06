import js from "@eslint/js";
import prettier from 'eslint-config-prettier';
import pluginReact from "eslint-plugin-react";
import reactHooks from 'eslint-plugin-react-hooks';
import { defineConfig } from "eslint/config";
import globals from "globals";
import tseslint from "typescript-eslint";

export default defineConfig([
  { files: ["**/*.{js,mjs,cjs,ts,mts,cts,jsx,tsx}"], plugins: { js }, extends: ["js/recommended"] },
  { files: ["**/*.{js,mjs,cjs,ts,mts,cts,jsx,tsx}"], languageOptions: { globals: {...globals.browser, ...globals.node} } },
  tseslint.configs.recommended,
  pluginReact.configs.flat.recommended,
  {
    files: ['**/*.{js,jsx,ts,tsx}'],
    plugins: { 'react-hooks': reactHooks },
    rules: {
      // TypeScript rules
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
      '@typescript-eslint/no-empty-object-type': 'warn',
      '@typescript-eslint/no-require-imports': 'warn',
      
      // React rules - disable the problematic ones for Next.js 13+
      'react/react-in-jsx-scope': 'off',
      'react/prop-types': 'off',
      'react/no-unknown-property': 'warn',
      'react/no-unescaped-entities': 'warn',
      'react/jsx-no-undef': 'error',
      
      // React Hooks rules
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'warn',
      
      // General rules
      'prefer-const': 'warn',
      'no-empty': 'warn',
      
      // Complexity and length rules
      'max-lines': ['warn', { max: 500, skipBlankLines: true, skipComments: true }],
      'max-lines-per-function': ['warn', { max: 100, skipBlankLines: true, skipComments: true }],
      'max-depth': ['warn', { max: 4 }],
      'complexity': ['warn', { max: 10 }],
      
      // Disallow in-line require and dynamic import()
      'no-restricted-syntax': [
        'error',
        {
          selector: "CallExpression[callee.name='require']",
          message: 'All require() calls must be at the top-level. In-line require is not allowed.'
        },
        {
          selector: 'ImportExpression',
          message: 'Dynamic import() is not allowed except for code-splitting. All imports should be at the top.'
        }
      ],
    },
  },
  {
    files: ['**/*.{js,jsx,ts,tsx}'],
    ignores: [
      'node_modules/**', 
      '.next/**', 
      '.next/types/**',
      '.next/types/**/*.ts',
      '.next/static/**',
      '.next/server/**',
      'out/**', 
      'dist/**', 
      'build/**'
    ],
    settings: {
      next: {
        rootDir: '.',
        appDir: ['src/app'],
        pagesDir: ['src/pages'],
      },
    },
  },
  // Separate configuration for .next files to disable all rules
  {
    files: ['.next/**/*'],
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-unused-vars': 'off',
      '@typescript-eslint/no-empty-object-type': 'off',
      '@typescript-eslint/no-unsafe-function-type': 'off',
      '@typescript-eslint/no-wrapper-object-types': 'off',
      '@typescript-eslint/no-unused-expressions': 'off',
      '@typescript-eslint/no-this-alias': 'off',
      'no-undef': 'off',
      'no-redeclare': 'off',
      'no-cond-assign': 'off',
      'no-empty': 'off',
      'no-control-regex': 'off',
      'no-prototype-builtins': 'off',
      'no-fallthrough': 'off',
      'max-lines': 'off',
      'max-lines-per-function': 'off',
      'complexity': 'off',
      'max-depth': 'off',
      'no-restricted-syntax': 'off',
    },
  },
  prettier,
]);
