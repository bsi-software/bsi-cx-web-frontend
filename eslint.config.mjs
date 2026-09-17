/*
 * Copyright (c) BSI Business Systems Integration AG. All rights reserved.
 * http://www.bsiag.com/
 */
import stylistic from '@stylistic/eslint-plugin';
import tseslint from 'typescript-eslint';

export default [
  {
    ignores: ['dist/', 'coverage/']
  },
  {
    files: ['**/*.ts'],
    languageOptions: {
      parser: tseslint.parser
    },
    plugins: {
      '@stylistic': stylistic
    },
    rules: {
      // Require braces on every if/else (and other) block body.
      curly: ['error', 'all'],
      // Makes curly's autofix produce a real multi-line block instead of
      // `if (x) {return;}`. minElements:1 leaves empty blocks such as
      // `function () {}` alone.
      '@stylistic/curly-newline': ['error', { minElements: 1, consistent: true }],
      '@stylistic/indent': ['error', 2],
      '@stylistic/quotes': ['error', 'single', { avoidEscape: true }]
    }
  }
];
