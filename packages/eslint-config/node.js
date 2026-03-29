/** @type {import("eslint").Linter.Config} */
module.exports = {
  extends: ['./base'],
  env: {
    node: true,
    es2022: true,
  },
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module',
  },
  rules: {
    'no-console': 'off',
  },
}
