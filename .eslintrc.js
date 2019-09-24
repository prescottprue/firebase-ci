module.exports = {
  parser: '@typescript-eslint/parser',
  'extends': [
    'airbnb-base',
    'prettier',
    'plugin:@typescript-eslint/recommended',
    'prettier/@typescript-eslint',
    'plugin:jsdoc/recommended'
  ],
  root: true,
  plugins: ['@typescript-eslint', 'prettier', 'jsdoc'],
  settings: {
    'import/resolver': {
      node: {
        moduleDirectory: ['node_modules', './src'],
        extensions: ['.js', '.ts']
      }
    }
  },
  env: {
    browser: true,
    node: true
  },
  rules: {
    '@typescript-eslint/no-explicit-any': 0,
    'import/prefer-default-export': 0,
    'no-shadow': 0,
    'consistent-return': 0,
    'no-new': 0,
    'new-cap': 0,
    'jsdoc/newline-after-description': 0,
    'jsdoc/require-param-type': 0,
    'jsdoc/require-returns-type': 0,
    'prettier/prettier': [
      'error',
      {
        singleQuote: true, // airbnb
        trailingComma: 'all', // airbnb
      }
    ]
  },
  overrides: [
    {
      files: ['cmds/**', 'bin/**'],
      rules: {
        'comma-dangle': ['error', { 'functions': 'never' }],
        '@typescript-eslint/explicit-function-return-type': 0,
        '@typescript-eslint/no-unused-vars': 0,
        '@typescript-eslint/no-var-requires': 0,
        'prefer-destructuring': 0,
        'prettier/prettier': [
          'error',
          {
            singleQuote: true, // airbnb
            trailingComma: 'none', // airbnb
          }
        ]
      }
    }
  ]
}
