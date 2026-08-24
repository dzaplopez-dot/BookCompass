import js from '@eslint/js';
import prettierRecommended from 'eslint-plugin-prettier/recommended';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import globals from 'globals';
import tseslint from 'typescript-eslint';

/**
 * Configuración plana (flat config) de ESLint para Book Compass.
 *
 * - Reglas recomendadas de ESLint + typescript-eslint.
 * - Reglas específicas de React Hooks y React Refresh (Vite).
 * - Prettier se integra al final: desactiva las reglas de formato
 *   conflictivas y reporta problemas de formato como errores de lint.
 */
export default tseslint.config([
  // Archivos generados que no deben analizarse.
  { ignores: ['dist', 'dev-dist', 'coverage'] },
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      js.configs.recommended,
      ...tseslint.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
      prettierRecommended,
    ],
    languageOptions: {
      ecmaVersion: 2023,
      globals: globals.browser,
    },
  },
]);
