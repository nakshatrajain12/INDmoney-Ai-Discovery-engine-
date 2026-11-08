import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(__dirname, '..', '..');
const read = (f: string) => fs.readFileSync(path.join(root, f), 'utf8');

function walk(dir: string, out: string[] = []): string[] {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p, out);
    else out.push(p);
  }
  return out;
}

describe('secrets hygiene', () => {
  it('.env.example contains no real values for secrets', () => {
    const lines = read('.env.example').split(/\r?\n/).filter((l) => /^[A-Z_]+=/.test(l));
    const get = (k: string) => lines.find((l) => l.startsWith(k + '='))?.slice(k.length + 1).split('#')[0]!.trim();
    expect(get('LLM_API_KEY')).toBe('');
    expect(get('LLM_ENABLED')).toBe('false');
    for (const l of lines) expect(l).not.toMatch(/sk-[A-Za-z0-9]{10,}/);
  });

  it('no secret is exposed through a NEXT_PUBLIC_ variable', () => {
    const files = [...walk(path.join(root, 'src')), path.join(root, '.env.example')];
    for (const f of files) {
      const t = fs.readFileSync(f, 'utf8');
      expect(t, f).not.toMatch(/NEXT_PUBLIC_[A-Z_]*(KEY|SECRET|TOKEN|PASSWORD)/);
    }
  });

  it('the LLM key is only referenced by the server-side config loader', () => {
    const offenders = walk(path.join(root, 'src'))
      .filter((f) => /\.(ts|tsx)$/.test(f))
      .filter((f) => fs.readFileSync(f, 'utf8').includes('LLM_API_KEY'))
      .map((f) => path.relative(root, f).split(path.sep).join('/'));
    expect(offenders).toEqual(['src/lib/config.ts']);
  });

  it('client components never import the config module', () => {
    for (const f of walk(path.join(root, 'src')).filter((x) => /\.tsx$/.test(x))) {
      const t = fs.readFileSync(f, 'utf8');
      if (t.trimStart().startsWith("'use client'")) expect(t, f).not.toMatch(/lib\/config/);
    }
  });

  it('.gitignore excludes env files, build output and dependencies', () => {
    const g = read('.gitignore');
    for (const must of ['.env', '.env.local', 'node_modules/', '.next/']) expect(g).toContain(must);
  });

  it('no committed .env file exists', () => {
    expect(fs.existsSync(path.join(root, '.env'))).toBe(false);
    expect(fs.existsSync(path.join(root, '.env.local'))).toBe(false);
  });
});
