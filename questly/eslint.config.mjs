import js from '@eslint/js'
import globals from 'globals'
import tseslint from 'typescript-eslint'
import reactHooks from 'eslint-plugin-react-hooks'
import nextPlugin from '@next/eslint-plugin-next'

/**
 * Flat ESLint configuration.
 *
 * The plugins are wired up directly rather than through `eslint-config-next`:
 * that package still bundles an `eslint-plugin-react` build that crashes on
 * ESLint 10, and its React rules are largely propTypes-era anyway. The rules
 * that actually matter here - the Rules of Hooks and Next's own correctness
 * rules - are included explicitly.
 */
export default tseslint.config(
  {
    ignores: [
      '.next/**',
      'node_modules/**',
      'playwright-report/**',
      'test-results/**',
      'src/generated/**',
      'e2e/.auth/**',
      'next-env.d.ts',
    ],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ['**/*.{ts,tsx,mjs}'],
    languageOptions: {
      globals: { ...globals.browser, ...globals.node },
      parserOptions: { ecmaFeatures: { jsx: true } },
    },
    plugins: {
      'react-hooks': reactHooks,
      '@next/next': nextPlugin,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      ...nextPlugin.configs.recommended.rules,
      ...nextPlugin.configs['core-web-vitals'].rules,

      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],
      '@typescript-eslint/consistent-type-imports': ['error', { prefer: 'type-imports' }],
      'no-console': ['error', { allow: ['warn', 'error'] }],
      eqeqeq: ['error', 'smart'],
      'prefer-const': 'error',
      'no-var': 'error',
    },
  },
  {
    // Scripts, seeds and tests intentionally print to stdout.
    files: [
      'prisma/**/*.ts',
      'scripts/**/*.{ts,mjs}',
      'src/lib/logger.ts',
      'tests/**/*.ts',
      'e2e/**/*.ts',
    ],
    rules: { 'no-console': 'off' },
  },
  {
    files: ['public/sw.js'],
    languageOptions: { globals: { ...globals.serviceworker } },
  },
)
