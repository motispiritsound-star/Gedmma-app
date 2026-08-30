/**
 * ESLint voor de hele monorepo.
 *
 * Naast de gebruikelijke regels staan hier de huisregels uit docs/architecture.md
 * als lint-regel, zodat ze niet alleen in een document staan maar ook worden
 * afgedwongen:
 *
 *  - de routelaag bevat geen SQL; die hoort in de module;
 *  - een bedrag gaat nooit door `Number()` of `parseFloat()`;
 *  - `dangerouslySetInnerHTML` is verboden;
 *  - `console.log` in productiecode maakt plaats voor de logger.
 */
import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import reactHooks from 'eslint-plugin-react-hooks';
import globals from 'globals';

const geenSqlInDeRoutelaag = {
  selector:
    "CallExpression[callee.property.name='query'] > TemplateLiteral, CallExpression[callee.property.name='query'] > Literal[value=/SELECT |INSERT |UPDATE |DELETE /i]",
  message:
    'De routelaag bevat geen SQL (zie docs/architecture.md). Roep een functie van de module aan.',
};

const geenFloatOpBedragen = {
  selector:
    "CallExpression[callee.name='parseFloat'], CallExpression[callee.name='Number'][arguments.0.property.name=/bedrag|totaal|saldo|debet|credit|prijs/i]",
  message:
    'Bedragen mogen nooit door een floating-pointconversie. Gebruik Money.vanTekst() uit @gedmma/money (zie ADR-006).',
};

export default tseslint.config(
  {
    ignores: [
      '**/node_modules/**',
      '**/dist/**',
      '**/build/**',
      '**/coverage/**',
      '**/playwright-report/**',
      '**/test-results/**',
      'apps/webscan/**',
      'apps/web/e2e/.auth/**',
    ],
  },

  js.configs.recommended,
  ...tseslint.configs.recommended,

  // --- Alles ---------------------------------------------------------------
  {
    files: ['**/*.{ts,tsx,js}'],
    languageOptions: {
      ecmaVersion: 2023,
      sourceType: 'module',
      globals: { ...globals.node, ...globals.browser },
    },
    rules: {
      'no-console': ['warn', { allow: ['error'] }],
      'no-implicit-coercion': ['error', { boolean: false }],
      eqeqeq: ['error', 'always', { null: 'ignore' }],
      'prefer-const': 'error',
      'no-var': 'error',
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_', caughtErrors: 'none' },
      ],
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/consistent-type-imports': ['error', { fixStyle: 'inline-type-imports' }],
      'no-restricted-syntax': ['error', geenFloatOpBedragen],
      'no-restricted-globals': [
        'error',
        { name: 'parseFloat', message: 'Gebruik Money uit @gedmma/money voor bedragen.' },
      ],
    },
  },

  // --- Backend: geen SQL in de routelaag ----------------------------------
  // SQL hoort binnen de module (repo.ts of service.ts). Een route valideert de
  // invoer, roept een servicefunctie aan en vertaalt het resultaat.
  {
    files: ['apps/api/src/routes/**/*.ts'],
    rules: {
      'no-restricted-syntax': ['error', geenFloatOpBedragen, geenSqlInDeRoutelaag],
    },
  },

  // --- Frontend ------------------------------------------------------------
  {
    files: ['apps/web/src/**/*.{ts,tsx}'],
    plugins: { 'react-hooks': reactHooks },
    languageOptions: { globals: globals.browser },
    rules: {
      ...reactHooks.configs.recommended.rules,
      'react-hooks/exhaustive-deps': 'warn',
      'no-restricted-properties': [
        'error',
        {
          object: 'dangerouslySetInnerHTML',
          message: 'Niet gebruiken: dit opent de deur naar cross-site scripting.',
        },
      ],
      'no-restricted-syntax': [
        'error',
        geenFloatOpBedragen,
        {
          selector: "JSXAttribute[name.name='dangerouslySetInnerHTML']",
          message: 'dangerouslySetInnerHTML is verboden (zie docs/security.md).',
        },
      ],
    },
  },

  // --- Tests mogen meer ----------------------------------------------------
  {
    files: ['**/test/**/*.{ts,tsx}', '**/e2e/**/*.ts', '**/*.test.{ts,tsx}'],
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
      'no-console': 'off',
      'no-restricted-syntax': 'off',
    },
  },

  // --- Scripts en commandoregel-hulpmiddelen -------------------------------
  // Deze bestanden praten met een mens in een terminal; daar hoort console thuis.
  {
    files: ['scripts/**/*.js', '**/*-cli.ts'],
    rules: { 'no-console': 'off' },
  },
);
