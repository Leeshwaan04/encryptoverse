// Hand-curated, sourced reference data for the Token Sales page. There is no free, neutral feed of
// token sales, so nothing here is "live": every entry names its sources and the date it was checked.
// Add an entry only with a primary or reputable-press source, and bump VERIFIED_ON when re-checking.

export const VERIFIED_ON = 'October 17, 2026';

export interface SaleSource {
  label: string;
  href: string;
}

export interface SalePlatform {
  name: string;
  summary: string;
  /** Eligibility / mechanics, only as stated by the platform itself. */
  notes: string[];
  href: string;
  docs?: SaleSource;
}

export const SALE_PLATFORMS: readonly SalePlatform[] = [
  {
    name: 'Coinbase token sales',
    summary: 'Public token sales run by Coinbase for verified account holders, paid for in USDC.',
    notes: [
      'Requires a verified Coinbase account in a supported country; availability varies by sale and the sales are not available in New York.',
      'When a sale is oversubscribed, a "fill from the bottom" method spreads tokens broadly; unused USDC is returned.',
      'No fee to buyers; the issuer pays Coinbase a fee on proceeds. Selling within 30 days of listing can reduce allocation in later sales.',
    ],
    href: 'https://www.coinbase.com/token-sales',
    docs: { label: 'Coinbase Help Center', href: 'https://help.coinbase.com/en/coinbase/trading-and-funding/buying-selling-or-converting-crypto/token-sales' },
  },
  {
    name: 'Sonar by Echo',
    summary: 'Infrastructure for projects to host their own public sales. Buyers use a reusable "Sonar eID".',
    notes: [
      'Each sale is hosted by the project itself, so eligibility, regions and terms differ from sale to sale.',
      'Plasma’s XPL sale in July 2025 was the first public sale run on Sonar, according to coverage of the launch.',
    ],
    href: 'https://echo.xyz',
  },
  {
    name: 'Legion',
    summary: 'Describes itself as a “MiCA-compliant ICO underwriter for Web3 token sales” with merit-based allocation.',
    notes: [
      'Its homepage does not state eligibility or regional restrictions; check the terms of each individual sale.',
      `Recent pre-ICO sales named on its homepage when checked on ${VERIFIED_ON}: Yield Basis, Giza and Sport.fun.`,
    ],
    href: 'https://legion.cc',
  },
  {
    name: 'ICO Drops',
    summary: 'A third-party calendar of upcoming, active and ended sales.',
    notes: [
      'Not affiliated with Encryptoverse. We do not vouch for its listings; always confirm a sale on the project’s own official channels.',
    ],
    href: 'https://icodrops.com',
  },
];

export interface PastSale {
  name: string;
  symbol: string;
  platform: string;
  when: string;
  /** Terms as published before or at the time of the sale. */
  terms: string[];
  /** What was reported about the outcome, with attribution. */
  outcome: string;
  sources: SaleSource[];
}

export const PAST_SALES: readonly PastSale[] = [
  {
    name: 'Monad',
    symbol: 'MON',
    platform: 'Coinbase token sales',
    when: 'November 17–22, 2025',
    terms: [
      '7.5% of a 100 billion MON starting supply',
      'Price $0.025 per MON, an implied $2.5 billion valuation',
      'Target of about $188 million if every token on offer sold',
    ],
    outcome: 'The first sale on Coinbase’s platform. Outlets reported different final totals, so none is repeated here; see the issuer disclosure.',
    sources: [
      { label: 'DL News, Nov 10, 2025', href: 'https://www.dlnews.com/articles/defi/monad-to-raise-more-funds-in-public-token-sale-on-coinbase/' },
      { label: 'Coinbase disclosure (PDF)', href: 'https://static-assets.coinbase.com/raise/cb_token_sales_monad_disclosure.pdf' },
    ],
  },
  {
    name: 'Pump.fun',
    symbol: 'PUMP',
    platform: 'Centralised exchanges, including Bybit',
    when: 'July 12, 2025',
    terms: ['150 billion PUMP, 15% of supply', 'Price $0.004 per PUMP', 'Up to $600 million'],
    outcome: 'The Block reported the public allocation sold out within minutes, citing a co-founder.',
    sources: [
      { label: 'The Block: sale announced', href: 'https://www.theblock.co/post/361811/pump-fun-token-sale-worth-600-million-set-for-july-12-on-bybit-and-other-exchanges' },
      { label: 'The Block: sold out', href: 'https://www.theblock.co/post/362320/pump-fun-raises-500-million-in-12-minutes-as-pump-tokens-fully-sell-out' },
    ],
  },
  {
    name: 'Plasma',
    symbol: 'XPL',
    platform: 'Sonar by Echo',
    when: 'July 2025',
    terms: ['10% of XPL supply', '$50 million raise at a $500 million fully diluted valuation'],
    outcome: 'Preceded by a separate stablecoin deposit round in June 2025. Those deposits were not the sale itself and are not a raise total.',
    sources: [
      { label: 'The Defiant: sale announcement', href: 'https://thedefiant.io/news/press-releases/plasma-announces-the-xpl-public-sale-powered-by-echos-sonar' },
      { label: 'The Block: $50M at $500M FDV', href: 'https://www.theblock.co/post/357897/plasma-doubles-its-deposit-cap-clarifies-it-is-eyeing-50m-public-sale-at-500m-fdv' },
    ],
  },
];

export const DUE_DILIGENCE: readonly { title: string; body: string }[] = [
  { title: 'Start from the official source', body: 'Reach a sale only through links published on the project’s verified website or social account. Fake sale pages and wallet-draining “presales” are common.' },
  { title: 'Check who can take part', body: 'Regions, KYC and accreditation rules differ per sale. Joining from a restricted country can lock funds or void the purchase.' },
  { title: 'Read the token terms', body: 'Total supply, the share sold, fully diluted valuation, team and investor unlocks, and vesting schedules decide how much sell pressure follows listing.' },
  { title: 'Understand the allocation method', body: 'First-come-first-served, pro-rata and merit-based sales fill differently. Know whether unused funds are refunded and whether you can cancel.' },
  { title: 'Verify the contract', body: 'Compare the sale contract address across official channels, look for an independent audit, and never sign a transaction you do not understand.' },
  { title: 'Size the risk', body: 'Newly sold tokens can fall below the sale price. Only commit what you can afford to lose entirely.' },
];
