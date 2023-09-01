module.exports = {
  root: true,
  parser: "babel-eslint",
  parserOptions: {
    ecmaVersion: 2018,
    sourceType: 'module',
    parser: "@typescript-eslint/parser"
  },
  env: {
    es6: true,
    node: true
  },
  extends: [
    "eslint:recommended"
  ],
  globals: {
    'XMLHttpRequest': true,
    'window': true,
    'document': true,
    'navigator': true,
    'wx': true
  },
  rules: {
    'no-console': process.env.NODE_ENV !== 'production' ? 0 : 2,
    'no-useless-escape': 0,
    'no-func-assign': 0,
    "@typescript-eslint/no-explicit-any": "off",
    'no-empty': 0
  }
}
