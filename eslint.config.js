import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  // 'dist' is build output; '.claude' holds agent worktrees (full repo copies,
  // incl. their own dist/ + minified vendor bundles) that must never be linted.
  globalIgnores(['dist', '**/dist', '.claude']),
  {
    files: ['**/*.{js,jsx}'],
    extends: [
      js.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
      parserOptions: {
        ecmaVersion: 'latest',
        ecmaFeatures: { jsx: true },
        sourceType: 'module',
      },
    },
    rules: {
      'no-unused-vars': ['error', { varsIgnorePattern: '^[A-Z_]' }],
    },
  },
  {
    // Vercel serverless functions run in Node, not the browser — give them the
    // Node globals (Buffer, process, etc.) so no-undef stops flagging them.
    files: ['api/**/*.js'],
    languageOptions: {
      globals: { ...globals.node },
    },
  },
])
