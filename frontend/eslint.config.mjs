import { dirname } from 'path';
import { fileURLToPath } from 'url';
import { FlatCompat } from '@eslint/eslintrc';

const compat = new FlatCompat({
  baseDirectory: dirname(fileURLToPath(import.meta.url)),
});

const eslintConfig = [
  ...compat.extends('next/core-web-vitals', 'next/typescript'),
  {
    rules: {
      // The UI must stay icon-based (Lucide); emoji are not allowed in source.
      'no-restricted-syntax': [
        'error',
        {
          selector: 'Literal[value=/(\\u{1F300}-\\u{1FAFF}|\\u{2600}-\\u{27BF})/u]',
          message: 'Emoji are not allowed. Use a lucide-react icon instead.',
        },
        {
          selector: 'TemplateElement[value.raw=/(\\u{1F300}-\\u{1FAFF}|\\u{2600}-\\u{27BF})/u]',
          message: 'Emoji are not allowed. Use a lucide-react icon instead.',
        },
      ],
    },
  },
  {
    ignores: ['.next/**', 'node_modules/**', 'next-env.d.ts'],
  },
];

export default eslintConfig;
