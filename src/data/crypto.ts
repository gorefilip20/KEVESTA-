import type { CryptoWallet } from "@/types";

export const supportedCryptos: CryptoWallet[] = [
  {
    currency: "Bitcoin",
    symbol: "BTC",
    network: "Bitcoin",
    icon: "₿",
    balance: 0.0245,
  },
  {
    currency: "Ethereum",
    symbol: "ETH",
    network: "Ethereum",
    icon: "Ξ",
    balance: 1.847,
  },
  {
    currency: "Tether",
    symbol: "USDT",
    network: "Ethereum (ERC-20)",
    icon: "₮",
    balance: 2450.0,
  },
  {
    currency: "USD Coin",
    symbol: "USDC",
    network: "Ethereum (ERC-20)",
    icon: "$",
    balance: 1820.0,
  },
  {
    currency: "Solana",
    symbol: "SOL",
    network: "Solana",
    icon: "◎",
    balance: 12.5,
  },
  {
    currency: "BNB",
    symbol: "BNB",
    network: "BNB Smart Chain",
    icon: "⬡",
    balance: 3.2,
  },
];

export const exchangeRates: Record<string, number> = {
  BTC: 67500,
  ETH: 3650,
  USDT: 1.0,
  USDC: 1.0,
  SOL: 185,
  BNB: 610,
};

export function convertToUSD(amount: number, symbol: string): number {
  return amount * (exchangeRates[symbol] || 0);
}

export function convertFromUSD(usdAmount: number, symbol: string): number {
  const rate = exchangeRates[symbol];
  if (!rate) return 0;
  return usdAmount / rate;
}

export function formatCryptoAmount(amount: number, symbol: string): string {
  if (symbol === "USDT" || symbol === "USDC") {
    return amount.toFixed(2);
  }
  if (symbol === "BTC") {
    return amount.toFixed(6);
  }
  return amount.toFixed(4);
}

export function shortenAddress(address: string): string {
  if (address.length <= 12) return address;
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}
