/** @type {import("eslint").Linter.Config} */
module.exports = {
  extends: ['./base', 'next/core-web-vitals', 'next/typescript'],
  rules: {
    '@typescript-eslint/no-explicit-any': 'warn',
  },
}
