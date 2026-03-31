const { defineConfig, globalIgnores } = require('eslint/config')
const globals = require('globals')
const js = require('@eslint/js')
const pluginVue = require('eslint-plugin-vue')
const pluginOxlint = require('eslint-plugin-oxlint')
const skipFormatting = require('eslint-config-prettier/flat')

module.exports = defineConfig([
  {
    name: 'app/files-to-lint',
    files: ['**/*.{vue,js,mjs,jsx}'],
  },
  {
    name: 'app/node-config-files',
    files: ['*.config.js', 'eslint.config.js'],
    languageOptions: {
      sourceType: 'commonjs',
      globals: {
        ...globals.node,
      },
    },
  },

  globalIgnores(['**/dist/**', '**/dist-ssr/**', '**/coverage/**']),

  {
    languageOptions: {
      globals: {
        ...globals.browser,
      },
    },
  },

  js.configs.recommended,
  ...pluginVue.configs['flat/essential'],

  ...pluginOxlint.buildFromOxlintConfigFile('.oxlintrc.json'),

  skipFormatting,
])
