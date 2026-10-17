import React from 'react';
import { SITE, DATA_SOURCES } from '../config/site';
import { INFO_ROUTES } from '../config/seo';
import { A, H2, P, UL } from './prose';

export interface InfoPageDef {
  path: string;
  title: string;
  description: string;
  body: React.ReactNode;
}

const contactLine = SITE.contactEmail ? (
  <>
    email <A href={`mailto:${SITE.contactEmail}`}>{SITE.contactEmail}</A> or open an issue on <A href={`${SITE.github}/issues`}>GitHub</A>
  </>
) : (
  <>
    open an issue on <A href={`${SITE.github}/issues`}>GitHub</A>
  </>
);

export const INFO_PAGES: InfoPageDef[] = [
  {
    ...INFO_ROUTES['/about'],
    body: (
      <>
        <P>
          Encryptoverse is an independent cryptocurrency market-data dashboard. It shows prices, market capitalisation, trading volume,
          price history, market sentiment and news headlines for the top 50 cryptocurrencies, using named third-party sources that are
          listed on our <a className="text-cyan-400 underline" href="/methodology">Methodology &amp; Data Sources</a> page.
        </P>
        <H2>What we are</H2>
        <UL>
          <li>A read-only information tool. We do not hold funds, execute trades, or ask for private keys or seed phrases.</li>
          <li>Open source: the full code is public on <A href={SITE.github}>GitHub</A>, so how every number is produced can be inspected.</li>
          <li>Transparent about limits: where data is delayed, estimated or unavailable, the interface says so instead of filling in a number.</li>
        </UL>
        <H2>What we are not</H2>
        <UL>
          <li>Not a broker, exchange, custodian, investment adviser or financial institution.</li>
          <li>Not a source of investment, tax or legal advice. See the <a className="text-cyan-400 underline" href="/risk-disclosure">Risk Disclosure</a>.</li>
          <li>Not paid by any listed project. No coin is ranked, promoted or featured in exchange for payment.</li>
        </UL>
        <H2>Who runs it</H2>
        <P>
          {SITE.operator ? `Encryptoverse is operated by ${SITE.operator}.` : 'Encryptoverse is an independently run project.'} To report an
          error, request a correction or ask a question, {contactLine}.
        </P>
        <H2>Credits</H2>
        <UL>
          <li>The animation behind the home-page headline is AI-generated artwork.</li>
          <li>Coin logos: the open-source <A href="https://github.com/spothq/cryptocurrency-icons">cryptocurrency-icons</A> set (CC0 1.0 public-domain dedication). Market data providers are listed on the <a className="text-cyan-400 underline" href="/methodology">Methodology</a> page.</li>
        </UL>
        <H2>Corrections</H2>
        <P>
          If you find incorrect data or a misleading statement, tell us. Factual errors in our own code or copy are fixed promptly and the fix is
          recorded in the public commit history. Errors in third-party data should also be reported to the original provider.
        </P>
      </>
    ),
  },
  {
    ...INFO_ROUTES['/methodology'],
    body: (
      <>
        <P>This page documents how each figure on the site is produced so you can judge how far to rely on it.</P>
        <H2>Data sources</H2>
        <div className="overflow-x-auto rounded-xl border border-slate-800">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-900/70 text-slate-400">
              <tr>
                <th className="px-3 py-2 font-semibold">Source</th>
                <th className="px-3 py-2 font-semibold">Used for</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {DATA_SOURCES.map((s) => (
                <tr key={s.name}>
                  <td className="px-3 py-2 whitespace-nowrap">
                    <A href={s.href}>{s.name}</A>
                  </td>
                  <td className="px-3 py-2 text-slate-300">{s.what}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <H2>How data is fetched</H2>
        <UL>
          <li>
            Requests go through the Encryptoverse edge API, which tries several providers in turn and uses the first that answers, so no single
            provider is a point of failure. The source currently in use is named on the page (for example in the hero banner).
          </li>
          <li>Market data: CoinLore, with sparklines from DefiLlama. If a CoinGecko API key is configured it is tried first. If everything fails, your browser falls back to calling CoinGecko directly, then to your last cached data, and the page says so.</li>
          <li>Price history: Coinbase Exchange public candles, then Binance, then DefiLlama.</li>
        </UL>
        <H2>Refresh rates</H2>
        <UL>
          <li>Market data: cached at the edge for up to 2 minutes. Global totals: 5 minutes. Price history: up to 10 minutes. DeFi overview: 10 minutes. New pools: 5 minutes. News: 5 minutes. Gas: 30 seconds. Fear &amp; Greed: 15 minutes (the index itself updates daily).</li>
          <li>If a provider is unavailable we show the last data we received, labelled as cached, or an explicit notice. We do not invent values.</li>
        </UL>
        <H2>How specific figures are calculated</H2>
        <UL>
          <li><strong>Coin list and ranking:</strong> the 50 largest assets by market capitalisation as ranked by the data provider.</li>
          <li><strong>24h volume in the top ticker:</strong> the sum of 24h volume across those 50 coins, labelled “top 50”. Providers’ own global-volume fields are not used because they are unreliable.</li>
          <li><strong>Most traded / gainers / losers:</strong> the same 50 coins sorted by 24h volume or 24h price change. Nothing is hand-picked.</li>
          <li><strong>Categories</strong> (Layer 1, DeFi, Meme, etc.) are assigned by Encryptoverse using a keyword list on each coin’s name and symbol. They are a convenience filter, not an authoritative classification, and some coins may be mis-categorised.</li>
          <li><strong>Price history charts:</strong> exchange candle closes for 1 day, 7 days, 1 month and 1 year, thinned to at most about 120 points. USDT-quoted pairs are treated as USD.</li>
          <li><strong>Other currencies:</strong> EUR and GBP use the latest ECB reference rate. BTC and ETH quotes divide by the BTC/ETH price (at the same timestamp for charts). Percentage changes are always USD-based.</li>
          <li><strong>Converter:</strong> uses the same live prices; the rate shown is simply price ÷ price and excludes exchange fees and spreads.</li>
          <li><strong>DeFi view:</strong> chain TVL and stablecoin supply are DefiLlama’s figures. Governance proposals are public on Snapshot; anyone can create one, so inclusion is not an endorsement.</li>
          <li><strong>New pools:</strong> pools created in the last hours on any chain, taken from GeckoTerminal. They have not been reviewed by us and are extremely high risk.</li>
        </UL>
        <H2>Known limitations</H2>
        <UL>
          <li>Prices are aggregated market data, not the executable price on any particular exchange.</li>
          <li>Only 50 assets are covered. Smaller or newly launched tokens appear only in the New pools list.</li>
          <li>All-time high / low figures are shown only when the active provider supplies them (some do not).</li>
          <li>A few coins have no sparkline or exchange candles; their charts fall back to other sources or show as unavailable.</li>
          <li>The gas figure is the network’s current suggested price, not a guarantee of what a transaction will cost.</li>
          <li>News headlines are written by their publishers. Inclusion is not an endorsement.</li>
        </UL>
        <H2>Independence</H2>
        <P>No project pays to be listed, ranked or highlighted. If that ever changes, paid placements will be clearly labelled as such.</P>
      </>
    ),
  },
  {
    ...INFO_ROUTES['/risk-disclosure'],
    body: (
      <>
        <P><strong>Nothing on Encryptoverse is financial, investment, tax or legal advice.</strong> It is general information only.</P>
        <UL>
          <li>Cryptoassets are highly volatile. Prices can fall sharply and you can lose your entire investment.</li>
          <li>Past performance, charts and rankings do not indicate future results.</li>
          <li>Many tokens, especially new ones, carry risks of fraud, rug pulls, hacks, illiquidity and sudden delisting.</li>
          <li>Data may be delayed, incomplete or wrong. Always verify prices on the venue where you intend to trade.</li>
          <li>Regulation of cryptoassets differs by country and is changing. You are responsible for complying with the laws that apply to you.</li>
          <li>Only invest what you can afford to lose, do your own research, and consider speaking to a licensed adviser.</li>
          <li>Never share your seed phrase or private keys. Encryptoverse will never ask for them.</li>
        </UL>
      </>
    ),
  },
  {
    ...INFO_ROUTES['/privacy'],
    body: (
      <>
        <P>Last updated {SITE.lastUpdated}. This describes how the site actually behaves today.</P>
        <H2>What we collect</H2>
        <UL>
          <li>No accounts, no sign-up and no tracking or advertising cookies. We do not run analytics scripts.</li>
          <li>Our host, Cloudflare, processes standard request data (such as IP address and user agent) to deliver the site, cache responses and protect against abuse. See <A href="https://www.cloudflare.com/privacypolicy/">Cloudflare’s privacy policy</A>.</li>
        </UL>
        <H2>What stays in your browser</H2>
        <UL>
          <li>Your watchlist is saved in your browser’s local storage and never sent to us.</li>
          <li>Recently fetched market data is kept in session storage for faster loading and is cleared when you close the tab.</li>
          <li>If you connect a wallet, the connection happens directly between your browser and your wallet extension. We read your public address to display it and do not transmit it to our servers.</li>
        </UL>
        <H2>Third parties</H2>
        <UL>
          <li>Coin logos are loaded from the jsDelivr CDN (and, for a few coins, generated by our own server), so jsDelivr receives your IP address when the page loads. The site uses the system font stack, so no font provider is contacted.</li>
          <li>Market data, sentiment and news are fetched by our servers on your behalf, so those providers do not see your IP address.</li>
        </UL>
        <H2>Your choices</H2>
        <P>Clear your browser’s site data to remove the watchlist and cached data. Questions or requests: {contactLine}.</P>
      </>
    ),
  },
  {
    ...INFO_ROUTES['/terms'],
    body: (
      <>
        <P>Last updated {SITE.lastUpdated}. By using Encryptoverse you agree to these terms.</P>
        <H2>Information only</H2>
        <P>The site provides information for general purposes. It is not advice, an offer, or a solicitation to buy or sell any asset. You use it at your own risk and are solely responsible for your decisions. See the <a className="text-cyan-400 underline" href="/risk-disclosure">Risk Disclosure</a>.</P>
        <H2>No warranty</H2>
        <P>Data comes from third parties and is provided “as is” and “as available”, without warranties of accuracy, completeness, timeliness or availability. To the maximum extent permitted by law, Encryptoverse and its operators are not liable for losses arising from use of, or reliance on, the site.</P>
        <H2>Acceptable use</H2>
        <UL>
          <li>Do not attempt to disrupt the service, scrape it at abusive rates, or use it for unlawful purposes.</li>
          <li>Third-party names, logos and data belong to their owners and are used for identification and attribution only.</li>
        </UL>
        <H2>Third-party content</H2>
        <P>News headlines and excerpts belong to their publishers and link to the original articles. Links to external sites are provided for convenience; we are not responsible for their content.</P>
        <H2>Changes</H2>
        <P>We may update these terms; the date above shows the latest revision. Continued use means you accept the updated terms.</P>
        <H2>Contact</H2>
        <P>{SITE.operator ? `${SITE.operator} — ` : ''}{contactLine}.</P>
      </>
    ),
  },
  {
    ...INFO_ROUTES['/contact'],
    body: (
      <>
        <P>We welcome corrections and feedback.</P>
        <UL>
          {SITE.contactEmail && (
            <li>Email: <A href={`mailto:${SITE.contactEmail}`}>{SITE.contactEmail}</A></li>
          )}
          <li>Report a data error, bug or suggestion: <A href={`${SITE.github}/issues`}>GitHub Issues</A></li>
          <li>Source code: <A href={SITE.github}>github.com/Leeshwaan04/encryptoverse</A></li>
        </UL>
        <P>We cannot give investment advice, recover lost funds or help with exchange or wallet accounts. Beware of anyone claiming to represent Encryptoverse who asks for money or private keys.</P>
      </>
    ),
  },
];

export const pageForPath = (path: string): InfoPageDef | undefined => INFO_PAGES.find((p) => p.path === path.replace(/\/+$/, ''));
