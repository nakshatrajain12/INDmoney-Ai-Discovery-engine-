import type { RefusalDetail } from '@/contracts/coach';

export const DISCLAIMER_TEXT = 'Explains your SIP figures. Not investment advice.';

/**
 * Fixed, compliance-approved non-advice refusal response.
 * Uses exact sentences pre-approved by compliance and permitted by the banned-phrases linter.
 */
export const NON_ADVICE_REFUSAL: RefusalDetail = {
  reason: 'INVESTMENT_ADVICE_REQUESTED',
  message: "I can't tell you whether to continue, stop, buy or sell your mutual fund investments. The Return Coach helps you understand your portfolio figures and how SIPs work over time, but does not provide financial or investment advice.",
  educationalLinks: [
    {
      label: 'AMFI Investor Education - Knowledge Center',
      url: 'https://www.amfiindia.com/investor-corner/knowledge-center'
    },
    {
      label: 'SEBI Investor Education - Mutual Funds',
      url: 'https://investor.sebi.gov.in/mutualfunds.html'
    }
  ]
};

