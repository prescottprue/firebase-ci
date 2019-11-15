module.exports = {
  'root': true,
  parser: 'babel-eslint',
  extends: [
    'standard',
    'prettier',
    'prettier/react',
    'plugin:jsdoc/recommended'
  ],
  plugins: [
    'babel',
    'prettier',
    'jsdoc'
  ],
  env: {
    node: true
  },
  rules: {
    semi: [2,'never'],
    'no-console': 'error',
    'jsdoc/newline-after-description': 0,
    'prettier/prettier': ['error', {
      singleQuote: true,
      trailingComma: 'none',
      semi: false,
      bracketSpacing: true,
      jsxBracketSameLine: true,
      printWidth: 80,
      tabWidth: 2,
      useTabs: false
    }]
  }
}