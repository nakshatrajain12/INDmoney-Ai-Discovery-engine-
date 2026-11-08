import { describe, it, expect } from 'vitest';
import { ESLint } from 'eslint';
import path from 'node:path';

const root = path.resolve(__dirname, '..', '..');
const eslint = new ESLint({ cwd: root });

async function messages(file: string, code: string) {
  const [res] = await eslint.lintText(code, { filePath: path.join(root, file) });
  return res!.messages.filter((m) => m.ruleId === 'no-restricted-imports');
}

describe('architecture boundary: deterministic code never imports LLM code', () => {
  it.each([
    ['src/domain/returns/example.ts', "import { rephrase } from '@/domain/explain/rephraser';\nexport const x = rephrase;"],
    ['src/domain/debit/example.ts', "import { call } from '../explain/llm-client';\nexport const x = call;"],
    ['src/domain/pause/example.ts', "import { c } from '@/domain/explain/llm';\nexport const x = c;"],
    ['src/domain/confidence/example.ts', "import { c } from '../explain/rephraser';\nexport const x = c;"],
    ['src/data/mock/example.ts', "import { c } from '@/domain/explain/rephraser';\nexport const x = c;"]
  ])('lint fails for %s', async (file, code) => {
    const m = await messages(file, code);
    expect(m.length).toBeGreaterThan(0);
    expect(m[0]!.message).toMatch(/never import LLM code/i);
  });

  it('allows the orchestrator in explain/ to use the rephraser and domain code to import other domain code', async () => {
    expect(await messages('src/domain/explain/orchestrator.ts', "import { r } from './rephraser';\nexport const x = r;")).toEqual([]);
    expect(await messages('src/domain/returns/example.ts', "import { m } from '@/domain/returns/money';\nexport const x = m;")).toEqual([]);
  });
});

async function allMessages(file: string, code: string) {
  const [res] = await eslint.lintText(code, { filePath: path.join(root, file) });
  return res!.messages.filter((m) => ['no-restricted-imports', 'no-restricted-properties', 'no-restricted-globals'].includes(m.ruleId ?? ''));
}

describe('Phase 2 purity: domain/returns and domain/confidence perform no I/O, read no clock, use no randomness', () => {
  it.each([
    ['src/domain/returns/example.ts', "import fs from 'node:fs';\nexport const x = fs;"],
    ['src/domain/returns/example.ts', "import { readFileSync } from 'fs';\nexport const x = readFileSync;"],
    ['src/domain/returns/example.ts', "import { getProvider } from '@/data';\nexport const x = getProvider;"],
    ['src/domain/returns/example.ts', "export const x = Date.now();"],
    ['src/domain/returns/example.ts', "export const x = Math.random();"],
    ['src/domain/returns/example.ts', "export const x = () => fetch('https://example.com');"],
    ['src/domain/confidence/example.ts', "import http from 'node:http';\nexport const x = http;"],
    ['src/domain/returns/example.ts', "import { r } from '@/domain/explain/orchestrator';\nexport const x = r;"]
  ])('lint fails for %s: %s', async (file, code) => {
    expect((await allMessages(file, code)).length).toBeGreaterThan(0);
  });
  it('pure code is allowed', async () => {
    expect(await allMessages('src/domain/returns/example.ts', "import { addDays } from '@/lib/dates';\nexport const x = addDays('2026-01-01', 1);")).toEqual([]);
  });
});
