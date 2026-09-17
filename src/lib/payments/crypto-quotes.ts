import crypto from "node:crypto";

export type QuoteCurrency = "ETH" | "USDC" | "USDT";
export type CryptoQuote = {
  quoteId: string;
  currency: QuoteCurrency;
  fiatCurrency: "USD";
  fiatAmount: number;
  cryptoAmount: number;
  rate: number;
  expiresAt: string;
  source: "coinbase-spot";
};

const quoteSecret = () => process.env.CRYPTO_QUOTE_SECRET || process.env.COLUMN_WEBHOOK_SECRET || "development-only-quote-secret";
const ttlMs = () => Math.min(Math.max(Number(process.env.CRYPTO_QUOTE_TTL_SECONDS || 120), 30), 600) * 1000;

function encode(value: unknown) {
  return Buffer.from(JSON.stringify(value)).toString("base64url");
}
function sign(value: string) {
  return crypto.createHmac("sha256", quoteSecret()).update(value).digest("base64url");
}

export function verifyQuoteToken(token: string) {
  const [payload, signature] = token.split(".");
  if (!payload || !signature) return null;
  const expected = Buffer.from(sign(payload));
  const received = Buffer.from(signature);
  if (expected.length !== received.length || !crypto.timingSafeEqual(expected, received)) return null;
  const parsed = JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as CryptoQuote;
  if (!parsed.expiresAt || Date.parse(parsed.expiresAt) <= Date.now()) return null;
  return parsed;
}

export async function createCryptoQuote(fiatAmount: number, currency: QuoteCurrency): Promise<CryptoQuote> {
  const response = await fetch(`https://api.coinbase.com/v2/prices/${currency}-USD/spot`, { cache: "no-store", signal: AbortSignal.timeout(5000) });
  if (!response.ok) throw new Error(`Quote provider returned HTTP ${response.status}`);
  const payload = await response.json() as { data?: { amount?: string } };
  const rate = Number(payload.data?.amount);
  if (!Number.isFinite(rate) || rate <= 0) throw new Error("Quote provider returned an invalid rate");
  const expiresAt = new Date(Date.now() + ttlMs()).toISOString();
  const quote: CryptoQuote = { quoteId: "", currency, fiatCurrency: "USD", fiatAmount: Number(fiatAmount.toFixed(2)), cryptoAmount: fiatAmount / rate, rate, expiresAt, source: "coinbase-spot" };
  const payloadToken = encode(quote);
  quote.quoteId = `${payloadToken}.${sign(payloadToken)}`;
  return quote;
}
