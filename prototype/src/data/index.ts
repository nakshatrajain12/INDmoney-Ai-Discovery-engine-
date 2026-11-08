import type { SipDataProvider } from './provider';
import { MockProvider, MockDataProvider } from './mock/MockProvider';

export type { SipDataProvider };
export { MockProvider, MockDataProvider };

let provider: SipDataProvider | null = null;

/** The single place the application obtains its data provider. A future adapter is selected here. */
export function getProvider(): SipDataProvider {
  if (!provider) provider = new MockProvider();
  return provider;
}

export function resetProviderForTests(): void {
  provider = null;
}
