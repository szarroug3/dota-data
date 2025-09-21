import js from '@eslint/js';
import nextPlugin from '@next/eslint-plugin-next';
import prettier from 'eslint-config-prettier';
import pluginImport from 'eslint-plugin-import';
import jest from 'eslint-plugin-jest';
import jestDom from 'eslint-plugin-jest-dom';
import pluginReact from 'eslint-plugin-react';
import reactHooks from 'eslint-plugin-react-hooks';
import testingLibrary from 'eslint-plugin-testing-library';
import { defineConfig } from 'eslint/config';
import globals from 'globals';
import tseslint from 'typescript-eslint';

export default defineConfig([
  { ignores: ['.next/**', 'next-env.d.ts', '.backup/**', 'coverage/**', 'src/components/ui/**'] },
  {
    plugins: {
      '@next/next': nextPlugin,
    },
    rules: {
      ...nextPlugin.configs.recommended.rules,
    },
  },
  // Only lint source files, never .next or build output
  {
    files: ['src/**/*.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'],
    ignores: [
      'node_modules/**',
      'dist/**',
      'build/**',
      'out/**',
      '.next/**',
      '.backup/**',
      'coverage/**',
      'src/components/ui/**',
    ],
    plugins: { js },
    extends: ['js/recommended'],
    settings: {
      'import/resolver': {
        typescript: {
          project: './tsconfig.json',
        },
      },
      react: {
        version: 'detect',
      },
    },
  },
  {
    files: ['src/**/*.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'],
    ignores: [
      'node_modules/**',
      'dist/**',
      'build/**',
      'out/**',
      '.next/**',
      '.backup/**',
      'coverage/**',
      'src/components/ui/**',
    ],
    languageOptions: { globals: { ...globals.browser, ...globals.node } },
  },
  tseslint.configs.recommended,
  {
    ...pluginReact.configs.flat.recommended,
    settings: {
      react: {
        version: 'detect',
      },
    },
  },
  {
    files: ['**/*.{js,jsx,ts,tsx}'],
    plugins: {
      'react-hooks': reactHooks,
      import: pluginImport,
    },
    settings: {
      react: {
        version: 'detect',
      },
    },
    rules: {
      // TypeScript rules
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
      '@typescript-eslint/no-empty-object-type': 'warn',
      '@typescript-eslint/no-require-imports': 'warn',
      '@typescript-eslint/no-restricted-types': [
        'error',
        {
          types: {
            unknown: {
              message: "Do not use 'unknown', use a more specific type.",
            },
          },
        },
      ],

      // React rules - disable the problematic ones for Next.js 13+
      'react/react-in-jsx-scope': 'off',
      'react/prop-types': 'off',
      'react/no-unknown-property': 'warn',
      'react/no-unescaped-entities': 'warn',
      'react/jsx-no-undef': 'error',

      // React Hooks rules
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'warn',

      // Import rules
      'import/order': [
        'error',
        {
          groups: ['builtin', 'external', 'internal', 'parent', 'sibling', 'index'],
          'newlines-between': 'always',
          alphabetize: {
            order: 'asc',
            caseInsensitive: true,
          },
        },
      ],
      'import/no-unresolved': 'error',
      'import/no-duplicates': 'error',
      // Enforce frontend layering boundaries
      'import/no-restricted-paths': [
        'error',
        {
          zones: [
            // Frontend must not import backend code
            { target: 'src/frontend', from: 'src/backend' },
            { target: 'src/frontend', from: 'src/app/api' },

            // Stateless components: forbid importing contexts or API
            { target: 'src/frontend/**/components/stateless', from: 'src/frontend/**/contexts' },
            { target: 'src/frontend/**/components/stateless', from: 'src/frontend/**/api' },
            { target: 'src/frontend/**/components/stateless', from: 'src/frontend/lib/api-client' },

            // Containers: allow state contexts only (block fetching and api)
            { target: 'src/frontend/**/components/containers', from: 'src/frontend/**/contexts/fetching' },
            { target: 'src/frontend/**/components/containers', from: 'src/frontend/**/api' },
            { target: 'src/frontend/**/components/containers', from: 'src/frontend/lib/api-client' },

            // State contexts: forbid direct API access
            { target: 'src/frontend/**/contexts/state', from: 'src/frontend/**/api' },
            { target: 'src/frontend/**/contexts/state', from: 'src/frontend/lib/api-client' },

            // Fetching contexts: forbid importing UI
            { target: 'src/frontend/**/contexts/fetching', from: 'src/frontend/**/components' },
            { target: 'src/frontend/**/contexts/fetching', from: 'src/app' },
          ],
        },
      ],

      // General rules
      'prefer-const': 'warn',
      'no-empty': 'warn',

      // Complexity and length rules
      'max-lines': ['warn', { max: 500, skipBlankLines: true, skipComments: true }],
      'max-lines-per-function': ['warn', { max: 100, skipBlankLines: true, skipComments: true }],
      'max-depth': ['warn', { max: 4 }],
      complexity: ['warn', { max: 10 }],

      // Disallow in-line require and dynamic import() across the codebase
      'no-restricted-syntax': [
        'error',
        {
          selector: "CallExpression[callee.name='require']",
          message: 'All require() calls must be at the top-level. In-line require is not allowed.',
        },
        {
          selector: 'ImportExpression',
          message: 'Dynamic import() is not allowed in the frontend. Prefer static imports at the top of the file.',
        },
        {
          selector: 'TSImportType',
          message:
            "Inline type imports (import('...').Type) are not allowed. Use top-level `import type { ... } from '...';`.",
        },
      ],
    },
  },
  prettier,
  // Disable max-lines on generated API Zod files
  {
    files: ['src/types/api-zod/**/*.{ts,tsx}'],
    rules: {
      'max-lines': 'off',
    },
  },
  // TEST FILE OVERRIDES (flat config style)
  {
    files: ['src/**/*.test.{ts,tsx,js,jsx}', 'src/**/*.spec.{ts,tsx,js,jsx}', 'src/tests/**/*.{ts,tsx,js,jsx}'],
    ignores: ['coverage/**'],
    plugins: {
      jest,
      'testing-library': testingLibrary,
      'jest-dom': jestDom,
    },
    rules: {
      // Jest and Testing Library recommended rules (manually enabled)
      'jest/expect-expect': 'warn',
      'jest/no-disabled-tests': 'warn',
      'jest/no-focused-tests': 'error',
      'jest/no-identical-title': 'error',
      'jest/prefer-to-have-length': 'warn',
      'jest/valid-expect': 'error',
      'jest-dom/prefer-checked': 'warn',
      'jest-dom/prefer-enabled-disabled': 'warn',
      'jest-dom/prefer-required': 'warn',
      // Relaxed rules for tests
      'max-lines-per-function': 'off',
      'max-lines': 'off',
      'max-nested-callbacks': 'off',
      'no-magic-numbers': 'off',
      'no-unused-expressions': 'off',
      'no-console': 'off',
      'no-empty-function': 'off',
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/unbound-method': 'off',
      '@typescript-eslint/no-non-null-assertion': 'off',
      'import/no-extraneous-dependencies': ['error', { devDependencies: true }],
      // Allow require() calls in test files for mocking
      'no-restricted-syntax': [
        'error',
        {
          selector: 'ImportExpression',
          message: 'Dynamic import() is not allowed except for code-splitting. All imports should be at the top.',
        },
      ],
    },
  },
]);
