import js from '@eslint/js'
import globals from 'globals'
import react from 'eslint-plugin-react'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  globalIgnores(['dist', 'node_modules']),
  // Config files run in Node — allow require()/module
  {
    files: ['*.config.js', '*.config.cjs', 'postcss.config.js', 'tailwind.config.js'],
    languageOptions: { globals: { ...globals.node } },
  },
  {
    files: ['**/*.{js,jsx}'],
    extends: [
      js.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    plugins: { react },
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
      // React plugin: detects JSX usage so destructured `icon: Icon` aliases aren't reported
      'react/jsx-uses-vars': 'error',
      'react/jsx-uses-react': 'error',
      'no-unused-vars': ['error', {
        varsIgnorePattern: '^[A-Z_]',
        argsIgnorePattern: '^_',
        destructuredArrayIgnorePattern: '^_',
        caughtErrorsIgnorePattern: '^_|^e$|^err$',
        ignoreRestSiblings: true, // allow `const { x, ...rest } = obj` pattern
      }],
      // Stylistic — informational, not bugs:
      'react-hooks/set-state-in-effect': 'off', // standard data-fetching pattern
      'react-refresh/only-export-components': 'warn', // dev-only HMR hint
    },
  },
])
