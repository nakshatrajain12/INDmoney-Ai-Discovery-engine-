import { describe, it, expect } from 'vitest';
import { MockProvider } from '@/data/mock/MockProvider';
import { PERSONAS } from '@/data/mock/fixtures';
import { runProviderContract } from './provider-contract';

runProviderContract('MockProvider', () => new MockProvider());

describe('MockProvider construction', () => {
  it('fails fast, naming the problem, when a fixture is invalid', () => {
    const broken = structuredClone(PERSONAS);
    broken[0]!.sips[0]!.sip.declared.totalInvestedPaise += 1;
    expect(() => new MockProvider(broken)).toThrow(/Invalid mock fixtures[\s\S]*declared total invested/);
  });

  it('does not share state with the fixture module (mutating the input after construction has no effect)', async () => {
    const copy = structuredClone(PERSONAS);
    const p = new MockProvider(copy);
    copy[0]!.sips[0]!.sip.schemeName = 'TAMPERED';
    const d = await p.getSip(PERSONAS[0]!.sips[0]!.sip.id);
    expect(d!.sip.schemeName).not.toBe('TAMPERED');
  });
});
