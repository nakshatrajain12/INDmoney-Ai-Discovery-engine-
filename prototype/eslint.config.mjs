import { defineConfig, globalIgnores } from 'eslint/config';
import nextVitals from 'eslint-config-next/core-web-vitals';
import nextTs from 'eslint-config-next/typescript';

// Flat config (ESLint 9). `next lint` no longer exists in Next 16, so `npm run lint` calls ESLint directly.
export default defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    // Deterministic code must never import LLM code (docs/architecture.md section 3).
    files: [
      'src/domain/returns/**/*.{ts,tsx}',
      'src/domain/debit/**/*.{ts,tsx}',
      'src/domain/pause/**/*.{ts,tsx}',
      'src/domain/confidence/**/*.{ts,tsx}',
      'src/domain/sources/**/*.{ts,tsx}',
      'src/data/**/*.{ts,tsx}'
    ],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['**/explain/rephraser*', '**/explain/llm*', '**/explain/*llm*', '**/llm-client*'],
              message: 'Deterministic domain code must never import LLM code (docs/architecture.md section 3).'
            }
          ]
        }
      ]
    }
  },
  {
    // Phase 2: the returns engine and confidence label are pure. No I/O, no clock, no randomness, no LLM code.
    // (This block replaces the rule above for these folders, so it repeats the LLM pattern.)
    files: ['src/domain/returns/**/*.{ts,tsx}', 'src/domain/confidence/**/*.{ts,tsx}'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          paths: ['fs', 'fs/promises', 'path', 'http', 'https', 'net', 'child_process', 'os', 'next/server', 'next/headers', 'axios', 'node-fetch'].map((name) => ({
            name,
            message: 'Pure domain code performs no I/O (docs/implementation-plan.md Phase 2).'
          })),
          patterns: [
            { group: ['node:*'], message: 'Pure domain code performs no I/O (docs/implementation-plan.md Phase 2).' },
            { group: ['@/data', '@/data/**', '**/data/mock/**'], message: 'Pure domain code takes its inputs as arguments; it never reads from the data layer.' },
            {
              group: ['**/explain/rephraser*', '**/explain/llm*', '**/explain/*llm*', '**/llm-client*', '**/explain/**'],
              message: 'Deterministic domain code must never import LLM code (docs/architecture.md section 3).'
            }
          ]
        }
      ],
      'no-restricted-properties': [
        'error',
        { object: 'Date', property: 'now', message: 'Pure domain code has no clock: take the as-of date as an argument.' },
        { object: 'Math', property: 'random', message: 'Pure domain code is deterministic: no randomness.' }
      ],
      'no-restricted-globals': ['error', { name: 'fetch', message: 'Pure domain code performs no I/O.' }, { name: 'process', message: 'Pure domain code reads no environment.' }]
    }
  },
  globalIgnores(['clickable-prototype/**', 'design-source/**', 'tests/prototype-e2e/**', 'tests/live/**', '.next/**', 'node_modules/**', 'next-env.d.ts'])
]);
